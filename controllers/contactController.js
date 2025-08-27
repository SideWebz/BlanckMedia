export const contact = (req, res) => {
  res.render('pages/contact', { 
    title: 'BlanckMedia - Contact',
    extraCss: '/css/contact.css'
  });
};
