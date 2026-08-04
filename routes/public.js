const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { getAllProjects, getProjectById, getProjectsByBrand } = require('../utils/projectManager');
const { getAllSlots, getHeader } = require('../utils/homePageManager');

// ─── Rate limiter configuratie ─────────────────────────────────────────────
// Maximaal aantal contactformulier-inzendingen per IP binnen het tijdvenster.
const RATE_LIMIT_MAX     = 5;                  // max. aanvragen
const RATE_LIMIT_WINDOW  = 15 * 60 * 1000;    // tijdvenster in ms (15 minuten)
const MIN_FORM_TIME_MS   = 3 * 1000;          // minimale invultijd in ms

/**
 * In-memory opslag: { [ip]: { count: number, resetAt: number } }
 * Bij hoge belasting kan dit vervangen worden door Redis of een externe store.
 */
const rateLimitStore = new Map();

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetAt: record.resetAt };
}

function sanitizeInput(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateContactPayload(body) {
  const payload = body || {};
  const sanitized = {
    name: sanitizeInput(payload.name),
    email: sanitizeInput(payload.email),
    subject: sanitizeInput(payload.subject),
    message: sanitizeInput(payload.message),
    website: sanitizeInput(payload.website),
    turnstileToken: sanitizeInput(payload.turnstileToken),
    formStartTime: sanitizeInput(payload.formStartTime)
  };

  if (sanitized.website) {
    return { ok: true, silent: true, data: sanitized };
  }

  if (!sanitized.name || sanitized.name.length < 2 || sanitized.name.length > 80) {
    return { ok: false, message: 'Please enter a valid name.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (!sanitized.subject || sanitized.subject.length < 3 || sanitized.subject.length > 120) {
    return { ok: false, message: 'Please enter a valid subject.' };
  }

  if (!sanitized.message || sanitized.message.length < 10 || sanitized.message.length > 2000) {
    return { ok: false, message: 'Please enter a message between 10 and 2000 characters.' };
  }

  const startTime = Number.parseInt(sanitized.formStartTime, 10);
  if (!Number.isFinite(startTime) || Date.now() - startTime < MIN_FORM_TIME_MS) {
    return { ok: false, message: 'Please wait a moment before submitting the form.' };
  }

  if (!sanitized.turnstileToken) {
    return { ok: false, message: 'Please complete the security check.' };
  }

  return { ok: true, silent: false, data: sanitized };
}

async function verifyTurnstileToken(token, ip) {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    throw new Error('TURNSTILE_SECRET_KEY is not configured.');
  }

  const params = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: ip
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const result = await response.json();
  return result.success === true;
}

// Verwijder verlopen records periodiek om geheugenlek te voorkomen (elke 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) rateLimitStore.delete(ip);
  }
}, 30 * 60 * 1000);
// ──────────────────────────────────────────────────────────────────────────

// Initialize transporter for Nodemailer (port 587, STARTTLS)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


// Optional: verify connection immediately
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection failed:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Home page
router.get('/', (req, res) => {
  const header = getHeader();
  const slots = getAllSlots();
  res.render('home', { 
    title: 'Home', 
    includeHome: true,
    header: header,
    homeSlots: slots
  });
});

// Services page
router.get('/services', (req, res) => {
  res.render('services', { 
    title: 'Services',
    includeCommercials: true,
    includeSocialMedia: true,
    includeBrandStories: true
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact', includeContact: true });
});

// Contact form submission
router.post('/contact', async (req, res) => {
  // ── 1. Honeypot-controle ──────────────────────────────────────────────────
  if (req.body?.website) {
    return res.json({ success: true, message: 'Message sent successfully!' });
  }

  // ── 2. Rate limiting op basis van IP-adres ────────────────────────────────
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    const resetMinutes = Math.ceil((rateCheck.resetAt - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Te veel aanvragen. Probeer het opnieuw over ${resetMinutes} minut${resetMinutes === 1 ? '' : 'en'}.`
    });
  }

  // ── 3. Server-side veldvalidatie en sanitatie ───────────────────────────
  const validation = validateContactPayload(req.body);

  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  if (validation.silent) {
    return res.json({ success: true, message: 'Message sent successfully!' });
  }

  const { data } = validation;

  try {
    const turnstileVerified = await verifyTurnstileToken(data.turnstileToken, clientIp);

    if (!turnstileVerified) {
      return res.status(403).json({ success: false, message: 'Security verification failed. Please try again.' });
    }

    // Mail to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      replyTo: data.email,
      subject: `New Contact Form: ${data.subject}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\nMessage:\n${data.message}`
    });

    // Confirmation mail to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'We received your message - Blanck Media',
      text: `Hi ${data.name},\n\nThanks for contacting us! We received your message:\n\n${data.message}\n\nBest regards,\nBlanck Media`
    });

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Error sending message. Please try again.' });
  }
});

// About page
router.get('/about', (req, res) => {
  res.render('about', { title: 'About', includeAbout: true });
});

// Work (projects list)
router.get('/work', (req, res) => {
  const allProjects = getAllProjects();
  // Filter to only show visible projects on the work page
  const projects = allProjects.filter(p => p.visible !== false);
  res.render('work', { title: 'Work', projects, includeWork: true });
});

// Careers page
router.get('/careers', (req, res) => {
  res.render('careers', { title: 'Careers', includeCareers: true });
});

// Individual project page
router.get('/projects/:id', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) return res.status(404).render('404', { layout: 'main' });
  
  // Get related projects from same brand
  const relatedProjects = project.brand
    ? getProjectsByBrand(project.brand).filter(p => String(p.id) !== String(project.id)).slice(0, 3)
    : [];
  
  res.render('project', { 
    title: project.title, 
    project,
    relatedProjects,
    includeProject: true
  });
});

module.exports = router;
