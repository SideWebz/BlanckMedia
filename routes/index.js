const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { title: 'BlanckMedia', message: 'This site is under construction.' });
});

module.exports = router;
