import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import webRoutes from './routes/web.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handlebars
app.engine('hbs', engine({ 
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Nodemailer transporter (Gmail)
const transporter = nodemailer.createTransport({
 host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS gebruikt, maar geen SSL op poort 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Route voor contactform
app.post('/send-email', (req, res) => {
  const { company, name, email, message } = req.body;

  const mailOptions = {
    from: '"BlanckMedia Contact Form" <invoicing@blanckmedia.be>',
    to: 'invoicing@blanckmedia.be',
    replyTo: email,
    subject: `Nieuwe vraag van ${name} via contactformulier`,
    html: `
      <h2>BlanckMedia Contactformulier</h2>
      <p><strong>Bedrijf:</strong> ${company}</p>
      <p><strong>Naam:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Vraag:</strong><br>${message}</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if(error){
      console.log(error);
      return res.status(500).send('Er is iets fout gegaan bij het verzenden van de email.');
    }
    console.log('Email verstuurd: ' + info.response);
    res.status(200).send('Bedankt! Je bericht is verstuurd.');
  });
});

// Routes
app.use('/', webRoutes);

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
