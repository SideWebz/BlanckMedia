const toggler = document.querySelector('.navbar-toggler');
const overlay = document.querySelector('.navbar-overlay');

toggler.addEventListener('click', () => {
  toggler.classList.toggle('active'); // active class voor animatie kruis
  overlay.classList.toggle('active');  // overlay show/hide
  document.body.classList.toggle('menu-open'); // scroll lock

  // Scroll naar boven als het menu wordt geopend
  if (overlay.classList.contains('active')) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // smooth scroll naar boven
    });
  }
});

// Verwijder overlay bij scherm groter dan lg
window.addEventListener('resize', () => {
  if(window.innerWidth > 992){
    overlay.classList.remove('active');
    toggler.classList.remove('active');
    document.body.classList.remove('menu-open');
  }
});
