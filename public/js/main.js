
// Navbar scroll effect
// Prevent body scroll wanneer menu open is
const navbarToggler = document.querySelector('.navbar-toggler');
const navbarCollapse = document.querySelector('.navbar-collapse');

if (navbarToggler && navbarCollapse) {
  
  // Luister naar Bootstrap's collapse events (betrouwbaarder)
  navbarCollapse.addEventListener('shown.bs.collapse', function() {
    // Menu is nu volledig open
    document.body.classList.add('menu-open');
  });

  navbarCollapse.addEventListener('hidden.bs.collapse', function() {
    // Menu is nu volledig gesloten
    document.body.classList.remove('menu-open');
  });

  // Sluit menu bij klik op nav link
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth < 992) {
        // Gebruik Bootstrap's collapse method om netjes te sluiten
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) {
          bsCollapse.hide();
        } else {
          navbarCollapse.classList.remove('show');
          document.body.classList.remove('menu-open');
        }
      }
    });
  });

  // Sluit menu bij screen resize
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 992 && navbarCollapse.classList.contains('show')) {
      const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
      if (bsCollapse) {
        bsCollapse.hide();
      } else {
        navbarCollapse.classList.remove('show');
        document.body.classList.remove('menu-open');
      }
    }
  });
}


// Services Tabs Functionality
const serviceTabs = document.querySelectorAll('.service-tab');
const tabContents = document.querySelectorAll('.tab-content');

serviceTabs.forEach(tab => {
  tab.addEventListener('click', function() {
    const targetTab = this.getAttribute('data-tab');
    
    // Remove active class from all tabs and contents
    serviceTabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    this.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
  });
});