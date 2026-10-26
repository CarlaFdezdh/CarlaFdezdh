/* SignoFy · comportamiento de la página
   Sin dependencias. Respeta prefers-reduced-motion. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const raf = fn => { let t = false; return () => { if (!t) { t = true; requestAnimationFrame(() => { t = false; fn(); }); } }; };

  /* ---------- Navegación ---------- */
  const nav = $('#nav'), burger = $('#burger');
  const onNav = raf(() => nav.classList.toggle('scrolled', scrollY > 12));
  addEventListener('scroll', onNav, { passive: true });
  onNav();

  const setMenu = open => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#navlinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // enlace activo según la sección visible (la lista de espera no está en el menú: no marca ninguno)
  const links = $$('#navlinks a[href^="#"]').filter(a => !a.classList.contains('only-m'));
  const order = ['#idea', '#como', '#funciones', '#hoja', '#lista', '#faq'].map(h => $(h));
  const onSpy = raf(() => {
    let cur = -1;
    order.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= innerHeight * .4) cur = i; });
    const id = cur >= 0 ? '#' + order[cur].id : '';
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === id));
  });
  addEventListener('scroll', onSpy, { passive: true });
  onSpy();

  /* ---------- Portada: las manos siguen un poco al cursor ---------- */
  const art = $('.hero-art');
  if (art && !reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $('.hero').addEventListener('pointermove', e => {
      const r = art.getBoundingClientRect();
      art.style.setProperty('--px', clamp((e.clientX - (r.left + r.width / 2)) / innerWidth * 2, -1, 1).toFixed(3));
      art.style.setProperty('--py', clamp((e.clientY - (r.top + r.height / 2)) / innerHeight * 2, -1, 1).toFixed(3));
    });
  }

  /* ---------- Frase de transparencia: se ilumina palabra a palabra con el scroll ---------- */
  const st = $('[data-scrub]');
  if (st) {
    const text = st.textContent.trim().replace(/\s+/g, ' ');
    st.setAttribute('aria-label', text);
    st.textContent = '';
    const words = text.split(' ').map((w, i, a) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      st.appendChild(s);
      if (i < a.length - 1) st.appendChild(document.createTextNode(' '));
      return s;
    });
    const fill = raf(() => {
      const r = st.getBoundingClientRect();
      const p = reduce ? 1 : clamp((innerHeight * .86 - r.top) / (r.height + innerHeight * .28), 0, 1);
      const lit = p * words.length;
      words.forEach((w, i) => { w.style.opacity = (.16 + .84 * clamp(lit - i, 0, 1)).toFixed(2); });
    });
    addEventListener('scroll', fill, { passive: true });
    addEventListener('resize', fill);
    fill();
  }

  /* ---------- Entradas al hacer scroll (una sola vez, con escalonado) ---------- */
  const group = new Map();
  const stagger = $$('.principle, .card, .tl, .checks, .perks').forEach(el => {
    const p = el.parentElement;
    const i = group.get(p) || 0;
    group.set(p, i + 1);
    el.style.setProperty('--d', (i * 90) + 'ms');
    if (el.matches('.checks, .perks')) $$('li', el).forEach((li, k) => li.style.setProperty('--d', (k * 90) + 'ms'));
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('.principle, .card, .tl, .checks, .perks').forEach(el => io.observe(el));

  /* ---------- Hoja de ruta: la línea se rellena con el scroll ---------- */
  const tlEl = $('#timeline');
  if (tlEl) {
    const upd = raf(() => {
      const r = tlEl.getBoundingClientRect();
      tlEl.style.setProperty('--p', reduce ? 1 : clamp((innerHeight * .62 - r.top) / r.height, 0, 1).toFixed(4));
    });
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* ---------- Cómo funciona: el móvil cambia de pantalla según el paso ---------- */
  const steps = $$('.step'), screens = $$('.screen');
  const show = n => {
    steps.forEach(s => s.classList.toggle('is-on', s.dataset.step === String(n)));
    screens.forEach(s => s.classList.toggle('is-on', s.dataset.screen === String(n)));
  };
  const desktop = matchMedia('(min-width: 981px)');
  let current = 1, auto = null;
  const spy = raf(() => {
    if (!desktop.matches) return;
    let best = 1, d = Infinity;
    steps.forEach(s => {
      const r = s.getBoundingClientRect();
      const dist = Math.abs(r.top + r.height / 2 - innerHeight * .52);
      if (dist < d) { d = dist; best = +s.dataset.step; }
    });
    if (best !== current) { current = best; show(best); }
  });
  addEventListener('scroll', spy, { passive: true });
  addEventListener('resize', spy);
  spy();

  // en móvil no hay paso pegado: las pantallas rotan solas mientras se ven
  const phone = $('.phone');
  if (phone && !reduce) {
    new IntersectionObserver(es => {
      clearInterval(auto);
      if (es[0].isIntersecting && !desktop.matches) {
        auto = setInterval(() => { current = current % 4 + 1; show(current); }, 3600);
      }
    }, { threshold: .5 }).observe(phone);
  }

  /* ---------- Mini lección interactiva ---------- */
  const quiz = $('#quiz'), fb = $('#quiz-fb');
  if (quiz) {
    let timer;
    const reset = () => {
      $$('.s-opt', quiz).forEach(b => { b.disabled = false; b.className = 's-opt'; });
      fb.className = 's-feedback'; fb.textContent = '';
    };
    quiz.addEventListener('click', e => {
      const b = e.target.closest('.s-opt'); if (!b || b.disabled) return;
      clearTimeout(timer);
      const ok = b.dataset.ok === '1';
      $$('.s-opt', quiz).forEach(x => x.disabled = true);
      b.classList.add(ok ? 'ok' : 'bad');
      if (!ok) $$('.s-opt', quiz).find(x => x.dataset.ok === '1').classList.add('ok');
      fb.className = 's-feedback ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = ok ? '<svg class="ic"><use href="#i-check"/></svg>¡Correcto!<span class="xp">+30 XP</span>' : 'Casi. Esta vez era «Te quiero».';
      timer = setTimeout(reset, 2600);
    });
  }

  /* ---------- Preguntas frecuentes ---------- */
  $$('.qa').forEach(qa => {
    const btn = $('.q', qa);
    btn.addEventListener('click', () => {
      const open = !qa.classList.contains('open');
      qa.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });

  /* ---------- Formulario de lista de espera ---------- */
  const form = $('#wl-form'), err = $('#form-err'), ok = $('#wl-success');
  // Punto de integración: sustituir por una llamada real (Formspree, Netlify Forms, Mailchimp…).
  const submitWaitlist = data => new Promise(res => setTimeout(() => res(data), 450));

  const fail = (msg, field) => {
    err.textContent = msg; err.hidden = false;
    if (field) { field.closest('.field')?.classList.add('err'); field.focus(); }
  };
  form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('err'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.hidden = true;
    $$('.field', form).forEach(f => f.classList.remove('err'));
    const nombre = form.nombre, email = form.email, agree = $('#agree');
    if (!nombre.value.trim()) return fail('Dinos cómo te llamas para poder escribirte.', nombre);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return fail('Revisa el email: no parece una dirección válida.', email);
    if (!agree.checked) { fail('Necesitamos que aceptes la política de privacidad para apuntarte.'); return agree.focus(); }
    const btn = $('button[type=submit]', form);
    btn.disabled = true; btn.textContent = 'Apuntándote…';
    await submitWaitlist(Object.fromEntries(new FormData(form)));
    form.hidden = true; ok.hidden = false;
    // chispas verdes y azules al juntarse las manos
    const burst = $('.burst', ok);
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 90;
      s.style.background = i % 2 ? '#84b454' : '#3c9cc0';
      s.style.setProperty('--x', Math.cos(a) * d + 'px');
      s.style.setProperty('--y', Math.sin(a) * d * .8 + 'px');
      burst.appendChild(s);
    }
    ok.setAttribute('tabindex', '-1'); ok.focus({ preventScroll: true });
  });

  /* ---------- Cookies ---------- */
  const cookie = $('#cookie');
  let saved = null;
  try { saved = localStorage.getItem('sf-cookies'); } catch (e) {}
  if (!saved) setTimeout(() => { cookie.hidden = false; }, 1600);
  cookie.addEventListener('click', e => {
    const b = e.target.closest('[data-cookie]'); if (!b) return;
    try { localStorage.setItem('sf-cookies', b.dataset.cookie); } catch (e) {}
    cookie.hidden = true;
  });
})();
