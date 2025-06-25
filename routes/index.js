const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { title: 'BlanckMedia', activePage: 'home' });
});

router.get('/projects', (req, res) => {
  res.render('projects', { title: 'Our Projects', activePage: 'projects' });
});


module.exports = router;
