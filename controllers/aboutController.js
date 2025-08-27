export const about = (req, res) => {
  res.render('pages/about', { 
    title: 'About',
    extraCss: '/css/about.css'
  });
};
