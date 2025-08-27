export const about = (req, res) => {
  res.render('pages/about', { 
    title: 'BlanckMedia - About',
    extraCss: '/css/about.css'
  });
};
