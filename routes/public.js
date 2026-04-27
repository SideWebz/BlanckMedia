const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { getAllProjects, getProjectById, getProjectsByBrand } = require('../utils/projectManager');
const { getAllSlots, getHeader } = require('../utils/homePageManager');

// ─── Rate limiter configuratie ─────────────────────────────────────────────
// Maximaal aantal contactformulier-inzendingen per IP binnen het tijdvenster.
const RATE_LIMIT_MAX     = 5;                  // max. aanvragen
const RATE_LIMIT_WINDOW  = 15 * 60 * 1000;    // tijdvenster in ms (15 minuten)

/**
 * In-memory opslag: { [ip]: { count: number, resetAt: number } }
 * Bij hoge belasting kan dit vervangen worden door Redis of een externe store.
 */
const rateLimitStore = new Map();

/**
 * Controleert of het opgegeven IP-adres de rate limit heeft bereikt.
 * @param {string} ip - Het IP-adres van de aanvrager.
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    // Eerste aanvraag of tijdvenster verlopen: reset de teller
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetAt: record.resetAt };
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
  // Het 'website'-veld is verborgen voor echte gebruikers.
  // Als het ingevuld is, is de aanvrager hoogstwaarschijnlijk een bot.
  if (req.body.website) {
    // Stille weigering: de bot krijgt een 200-respons zodat hij niet opnieuw probeert.
    return res.json({ success: true, message: 'Message sent successfully!' });
  }

  // ── 2. Rate limiting op basis van IP-adres ────────────────────────────────
  // Haal het echte IP op (rekening houdend met proxies via X-Forwarded-For).
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    const resetMinutes = Math.ceil((rateCheck.resetAt - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Te veel aanvragen. Probeer het opnieuw over ${resetMinutes} minut${resetMinutes === 1 ? '' : 'en'}.`
    });
  }

  // ── 3. Server-side veldvalidatie ──────────────────────────────────────────
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Mail to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `New Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage:\n${message}`
    });

    // Confirmation mail to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'We received your message - Blanck Media',
      text: `Hi ${name},\n\nThanks for contacting us! We received your message:\n\n${message}\n\nBest regards,\nBlanck Media`
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
