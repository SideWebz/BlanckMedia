export const projects = (req, res) => {
  res.render('pages/projects', { 
    title: 'BlanckMedia - Projects',
    extraCss: '/css/projects.css',
    isProjects: true   
  });
};
