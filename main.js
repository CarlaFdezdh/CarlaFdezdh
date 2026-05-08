document.addEventListener('DOMContentLoaded', function () {
  var animatedItems = document.querySelectorAll('.fade-up');
  var nav = document.getElementById('main-nav');

  function showElement(element, delay) {
    window.setTimeout(function () {
      element.classList.add('visible');
    }, delay);
  }

  document.querySelectorAll('#hero .fade-up').forEach(function (element, index) {
    showElement(element, 100 + index * 150);
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    animatedItems.forEach(function (element) {
      observer.observe(element);
    });
  } else {
    animatedItems.forEach(function (element) {
      element.classList.add('visible');
    });
  }

  function updateNavShadow() {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }
  }

  updateNavShadow();
  window.addEventListener('scroll', updateNavShadow);
});
