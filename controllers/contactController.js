export const contact = (req, res) => {
  res.render('pages/contact', { 
    title: 'Contact',
    extraCss: '/css/contact.css'
  });
};
