export const projects = (req, res) => {
  res.render('pages/projects', { 
    title: 'Projects',
    extraCss: '/css/projects.css',
    isProjects: true   
  });
};
