// Activar animaciones solo cuando JS carga correctamente
document.documentElement.classList.add('js-ready');

// Fade-up con IntersectionObserver
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Hero visible de inmediato sin esperar scroll
document.querySelectorAll('#hero .fade-up').forEach((el, i) => {
  setTimeout(() => el.classList.add('visible'), 100 + i * 150);
});

// Nav shadow al hacer scroll
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}
