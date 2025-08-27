// Zorg dat GSAP via CDN geladen is in je HTML
// <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/gsap.min.js"></script>

window.addEventListener("DOMContentLoaded", () => {
  // Animate all elements from left
  gsap.utils.toArray(".animate-left").forEach(el => {
    gsap.fromTo(el,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
  });

  // Animate all elements from right
  gsap.utils.toArray(".animate-right").forEach(el => {
    gsap.fromTo(el,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
  });
});
