/* Carla Fernández · post ASTI · comportamiento
   Sin dependencias. Respeta prefers-reduced-motion. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const raf = fn => { let t = false; return () => { if (!t) { t = true; requestAnimationFrame(() => { t = false; fn(); }); } }; };
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  window.__ready = true;

  function botSVG() {
    return '<rect x="-27" y="-17" width="54" height="34" rx="11" fill="#cdbcf2" stroke="#2a1f26" stroke-width="2.5"/><rect x="-20" y="-24" width="16" height="7" rx="2.5" fill="#2a1f26"/><rect x="-20" y="17" width="16" height="7" rx="2.5" fill="#2a1f26"/><circle cx="18" cy="-8" r="6.5" fill="#fff" stroke="#2a1f26" stroke-width="2.5"/><circle cx="18" cy="8" r="6.5" fill="#fff" stroke="#2a1f26" stroke-width="2.5"/><path d="M-6 6L-13-1A4 4 0 0 1-6-4A4 4 0 0 1 1-1Z" fill="#e0476f"/>';
  }

  /* ---------- Progreso de lectura: Goty recorre la barra superior ---------- */
  const nav = $('#nav');
  const article = $('.story-grid');
  const prog = raf(() => {
    const r = article.getBoundingClientRect();
    const total = r.height - innerHeight * .6;
    nav.style.setProperty('--p', clamp((innerHeight * .25 - r.top) / total, 0, 1).toFixed(4));
  });
  addEventListener('scroll', prog, { passive: true });
  addEventListener('resize', prog);
  prog();

  /* ---------- Índice: escritorio (lateral) y móvil (barra horizontal) ---------- */
  const ids = ['inicio', 'proceso', 'aprendizajes', 'siguiente'];
  const secs = ids.map(id => document.getElementById(id));
  const tocLinks = $$('#toc a'), chips = $$('#toc-bar a'), bar = $('#toc-bar');
  let current = null;
  const spy = raf(() => {
    let idx = -1;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * .38) idx = i; });
    const id = idx >= 0 ? ids[idx] : null;
    if (id === current) return;
    current = id;
    [...tocLinks, ...chips].forEach(a => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    const chip = chips.find(a => a.getAttribute('aria-current'));
    if (chip && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  });
  addEventListener('scroll', spy, { passive: true });
  addEventListener('resize', spy);
  spy();

  /* ---------- Revelados al entrar en pantalla ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    el.classList.add('in');
    if (el.hasAttribute('data-r')) el.addEventListener('transitionend', function f(ev) { if (ev.propertyName === 'transform') { el.classList.add('done'); el.removeEventListener('transitionend', f); } });
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r], .mark').forEach(el => io.observe(el));

  /* ---------- Pegatinas y fotos arrastrables (el scroll vertical se conserva en móvil) ---------- */
  let zTop = 10;
  function makeDrag(el) {
    const base = +el.dataset.rot || 0;
    let tx = 0, ty = 0;
    const apply = rot => { el.style.translate = `${tx}px ${ty}px`; el.style.rotate = rot + 'deg'; };
    apply(base);
    el.addEventListener('pointerdown', e => {
      if (e.button) return;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      el.style.zIndex = ++zTop;
      const sx = e.clientX, sy = e.clientY, ox = tx, oy = ty;
      const par = el.offsetParent.getBoundingClientRect(), r0 = el.getBoundingClientRect();
      const minX = ox + (par.left - r0.left), maxX = ox + (par.right - r0.right);
      const minY = oy + (par.top - r0.top), maxY = oy + (par.bottom - r0.bottom);
      let lastX = sx;
      const move = ev => {
        tx = clamp(ox + ev.clientX - sx, Math.min(minX, maxX), Math.max(minX, maxX));
        ty = clamp(oy + ev.clientY - sy, Math.min(minY, maxY), Math.max(minY, maxY));
        const vx = ev.clientX - lastX; lastX = ev.clientX;
        apply(base + clamp(vx * 1.4, -14, 14));
      };
      const up = () => {
        el.classList.remove('dragging'); apply(base);
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  $$('.drag').forEach(makeDrag);

  /* ---------- Cursor: Goty te acompaña (solo con ratón) ---------- */
  if (fine && !reduce) {
    const c = document.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = `<div class="cursor-in"><svg class="cursor-bot" viewBox="-32 -28 64 56">${botSVG()}</svg><span class="cursor-label"></span></div>`;
    document.body.appendChild(c);
    const svg = $('.cursor-bot', c), label = $('.cursor-label', c);
    let mx = 0, my = 0, x = 0, y = 0, ang = 0, seen = false;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!seen) { seen = true; x = mx; y = my; } c.classList.add('on'); }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => c.classList.remove('on'));
    document.addEventListener('pointerover', e => {
      c.classList.toggle('hot', !!e.target.closest('a,button,.drag,.lcard'));
      const drag = e.target.closest('.drag');
      c.classList.toggle('label', !!drag);
      if (drag) label.textContent = 'Arrastra';
    });
    document.addEventListener('pointerdown', () => { svg.classList.remove('pop'); void svg.getBoundingClientRect(); svg.classList.add('pop'); });
    (function tick() {
      const dx = mx + 30 - x, dy = my + 24 - y;
      x += dx * .16; y += dy * .16;
      if (Math.hypot(dx, dy) > 1.5) { let d = Math.atan2(dy, dx) * 180 / Math.PI - ang; d = ((d + 540) % 360) - 180; ang += d * .2; }
      c.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      svg.style.rotate = ang.toFixed(1) + 'deg';
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- Cierre: Goty en la carretera, copiar email, volver ---------- */
  const roadBot = $('.road-bot');
  if (roadBot) roadBot.innerHTML = `<svg viewBox="-32 -28 64 56" aria-hidden="true">${botSVG()}</svg>`;

  const toast = $('#toast'); let tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); }
  $('#copy-mail').addEventListener('click', async () => {
    const mail = 'carlafdezdh@gmail.com';
    try { await navigator.clipboard.writeText(mail); }
    catch (e) { const t = document.createElement('textarea'); t.value = mail; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) {} t.remove(); }
    say('Email copiado: ' + mail);
  });

  $('#totop').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  // salida suave al volver al portfolio
  $$('a[href^="index.html"]').forEach(a => a.addEventListener('click', e => {
    if (reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 280);
  }));
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving'); });
})();
