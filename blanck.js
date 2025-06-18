const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();
const PORT = 2200;

// View engine setup
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Server start
app.listen(PORT, () => {
  console.log(`Blanck site running on http://localhost:${PORT}`);
});
