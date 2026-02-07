const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { getAllProjects, getProjectById, getProjectsByBrand } = require('../utils/projectManager');
const { getAllSlots, getHeader } = require('../utils/homePageManager');

// Initialize transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD
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
  try {
    const { name, email, subject, message } = req.body;

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Email to admin
    const adminMailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form: ${subject}`,
      replyTo: email,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // Confirmation email to user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'We received your message - Blanck Media',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>Blanck Media</p>
      `
    };

    // Send both emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

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

// Individual project page
router.get('/projects/:id', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) return res.status(404).render('404', { layout: 'main' });
  
  // Get related projects from same brand
  const relatedProjects = project.brand ? getProjectsByBrand(project.brand).filter(p => String(p.id) !== String(project.id)).slice(0, 3) : [];
  
  res.render('project', { 
    title: project.title, 
    project,
    relatedProjects,
    includeProject: true
  });
});

module.exports = router;
