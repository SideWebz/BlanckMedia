export const home = (req, res) => {
  res.render('pages/home', { 
    title: 'Home',
    extraCss: '/css/home.css'
  });
};
