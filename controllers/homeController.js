export const home = (req, res) => {
  res.render('pages/home', { 
    title: 'BlanckMedia',
    extraCss: '/css/home.css'
  });
};
