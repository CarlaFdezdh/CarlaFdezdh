document.addEventListener('DOMContentLoaded', function () {

  // 1. Hero visible de inmediato
  document.querySelectorAll('#hero .fade-up').forEach(function (el, i) {
    setTimeout(function () {
      el.classList.add('visible');
    }, 100 + i * 150);
  });

  // 2. El resto con IntersectionObserver
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(function (el) {
    observer.observe(el);
  });

  // 3. Nav shadow al hacer scroll
  var nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

});
