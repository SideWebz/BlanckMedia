const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { getAllProjects, getProjectById, getProjectsByBrand } = require('../utils/projectManager');
const { getAllSlots, getHeader } = require('../utils/homePageManager');

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
  const { name, email, subject, message } = req.body;

  // Validate inputs
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
  const projects = getAllProjects();
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
