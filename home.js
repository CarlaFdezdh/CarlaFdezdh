/* Carla Fernández · portfolio 2026 · comportamiento del index
   anime.js solo para la carga y las transiciones; el resto es CSS + JS ligero. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const raf = fn => { let t = false; return () => { if (!t) { t = true; requestAnimationFrame(() => { t = false; fn(); }); } }; };
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasAnime = typeof anime !== 'undefined';
  if (!hasAnime) root.classList.remove('anim');
  const motion = hasAnime && !reduce;
  window.__ready = true;

  /* ================= Goty: el robot siguelíneas que acompaña toda la página ================= */
  function botSVG() {
    return '<rect x="-27" y="-17" width="54" height="34" rx="11" fill="#cdbcf2" stroke="#2a1f26" stroke-width="2.5"/><rect x="-20" y="-24" width="16" height="7" rx="2.5" fill="#2a1f26"/><rect x="-20" y="17" width="16" height="7" rx="2.5" fill="#2a1f26"/><circle cx="18" cy="-8" r="6.5" fill="#fff" stroke="#2a1f26" stroke-width="2.5"/><circle cx="18" cy="8" r="6.5" fill="#fff" stroke="#2a1f26" stroke-width="2.5"/><path d="M-6 6L-13-1A4 4 0 0 1-6-4A4 4 0 0 1 1-1Z" fill="#e0476f"/>';
  }
  const botBox = () => `<svg viewBox="-32 -28 64 56" aria-hidden="true">${botSVG()}</svg>`;
  function trackD(W, H, rev) {
    const x = v => (rev ? W - v : v).toFixed(1);
    return `M${x(-80)} ${H * .62} C${x(W * .14)} ${H * .62} ${x(W * .16)} ${H * .36} ${x(W * .36)} ${H * .36} S${x(W * .52)} ${H * .68} ${x(W * .68)} ${H * .68} S${x(W * .84)} ${H * .4} ${x(W + 80)} ${H * .4}`;
  }
  function rideAt(path, len, p, bot, s) {
    const l = len * p, l0 = Math.max(0, l - 2), l1 = Math.min(len, l0 + 4);
    const a = path.getPointAtLength(l), b0 = path.getPointAtLength(l0), b1 = path.getPointAtLength(l1);
    const ang = Math.atan2(b1.y - b0.y, b1.x - b0.x) * 180 / Math.PI;
    bot.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${s})`);
  }
  const botScale = w => Math.max(.75, Math.min(1.25, w / 1100));

  /* ================= Transición entre secciones: Goty traza la pista, la línea engorda, salto, pellizco ================= */
  function initWipe() {
    const W = $('.wipe'); if (!W || !motion) return;
    const svg = $('.wipe-svg', W), A = $('.wl-a', W), B = $('.wl-b', W), bot = $('.wipe-bot', W);
    const lab = $('.wipe-label', W), num = $('.wipe-num', W);
    bot.innerHTML = botSVG();
    const names = { '#top': 'Inicio', '#about': 'Sobre mí', '#work': 'Trabajo', '#journey': 'Trayectoria', '#contact': 'Contacto' };
    let busy = false;
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const href = a.getAttribute('href'), name = names[href], target = name && $(href);
      if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      if (busy) return;
      busy = true;
      nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
      const w = innerWidth, h = innerHeight, s = botScale(w), big = h * 1.7;
      const rev = target.getBoundingClientRect().top + scrollY < scrollY;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      [A, B].forEach(p => p.setAttribute('d', trackD(w, h, rev)));
      const len = A.getTotalLength();
      const st = { phase: 'in', draw: 0, out: 0, wa: 8, wb: 8 };
      const render = () => {
        const inn = st.phase === 'in';
        const vis = (p, k) => { p.style.strokeDasharray = `${len} ${len}`; p.style.strokeDashoffset = inn ? len * (1 - k) : -len * k; };
        vis(A, inn ? st.draw : st.out);
        vis(B, inn ? Math.max(0, st.draw - .12) : st.out);
        A.style.strokeWidth = st.wa; B.style.strokeWidth = st.wb;
        rideAt(A, len, inn ? st.draw : st.out, bot, s);
      };
      lab.textContent = name; num.textContent = '✦';
      anime.set(lab, { translateY: '145%' });
      anime.set(num, { opacity: 0 });
      render();
      W.classList.add('on');
      anime.timeline({ update: render })
        .add({ targets: st, draw: 1, duration: 650, easing: 'easeInOutSine' }, 0)
        .add({ targets: st, wa: big, duration: 700, easing: 'easeInOutExpo' }, 440)
        .add({ targets: st, wb: big, duration: 700, easing: 'easeInOutExpo' }, 570)
        .add({ targets: lab, translateY: '0%', duration: 750, easing: 'easeOutExpo' }, 980)
        .add({ targets: num, opacity: 1, duration: 350, easing: 'linear' }, 1020)
        .finished.then(() => {
          const sm = parseInt(getComputedStyle(target).scrollMarginTop) || 0;
          scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + scrollY - sm), behavior: 'instant' });
          history.replaceState(null, '', href);
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          return new Promise(r => setTimeout(r, 230));
        }).then(() => {
          st.phase = 'out'; st.out = 0;
          return anime.timeline({ update: render })
            .add({ targets: lab, translateY: '-145%', duration: 480, easing: 'easeInOutExpo' }, 0)
            .add({ targets: num, opacity: 0, duration: 220, easing: 'linear' }, 0)
            .add({ targets: st, wb: 8, duration: 650, easing: 'easeInOutExpo' }, 80)
            .add({ targets: st, wa: 8, duration: 650, easing: 'easeInOutExpo' }, 190)
            .add({ targets: st, out: 1, duration: 600, easing: 'easeInOutSine' }, 720).finished;
        }).then(() => { W.classList.remove('on'); busy = false; });
    });
  }

  /* ================= Navegación: píldora que se desliza, progreso con Goty, menú móvil ================= */
  const nav = $('#nav'), burger = $('#burger');
  const links = $$('.nav-links a[data-nav]'), ind = $('.nav-ind'), linksBox = $('.nav-links');
  let active = null;
  function moveInd(a) {
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  links.forEach(a => { a.addEventListener('pointerenter', () => moveInd(a)); a.addEventListener('focus', () => moveInd(a)); });
  linksBox.addEventListener('pointerleave', () => moveInd(active));
  linksBox.addEventListener('focusout', () => moveInd(active));
  addEventListener('resize', () => moveInd(active));

  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('pointerdown', e => { if (nav.classList.contains('open') && !nav.contains(e.target)) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

  const secMap = [['about', 'about'], ['tools', 'about'], ['work', 'work'], ['journey', 'journey'], ['beyond', 'journey'], ['journal', 'journey'], ['contact', 'contact']]
    .map(([id, l]) => ({ el: document.getElementById(id), l })).filter(x => x.el);
  const onScroll = raf(() => {
    const max = root.scrollHeight - innerHeight;
    nav.style.setProperty('--p', max > 0 ? clamp(scrollY / max, 0, 1).toFixed(4) : 0);
    let cur = null;
    secMap.forEach(s => { if (s.el.getBoundingClientRect().top <= innerHeight * .4) cur = s.l; });
    const a = links.find(x => x.dataset.nav === cur) || null;
    if (a !== active) {
      active = a;
      links.forEach(x => { if (x === a) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
      if (!linksBox.matches(':hover')) moveInd(a);
    }
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ================= Cursor: Goty te sigue con inercia, gira hacia donde vas ================= */
  function initCursor() {
    if (!fine || !motion) return;
    const c = document.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = `<div class="cursor-in"><svg class="cursor-bot" viewBox="-32 -28 64 56">${botSVG()}</svg><span class="cursor-label"></span></div>`;
    document.body.appendChild(c);
    const svg = $('.cursor-bot', c), label = $('.cursor-label', c);
    const HOT = 'a,button,.drag,.tool,.tab', LABELS = [['.pcard', 'Ver'], ['.jcard', 'Leer'], ['.drag', 'Arrastra'], ['.t-award', '¡Celebra!']];
    let mx = 0, my = 0, x = 0, y = 0, ang = 0, seen = false;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!seen) { seen = true; x = mx; y = my; } c.classList.add('on'); }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => c.classList.remove('on'));
    document.addEventListener('pointerover', e => {
      c.classList.toggle('hot', !!e.target.closest(HOT));
      const hit = LABELS.find(([s]) => e.target.closest(s));
      c.classList.toggle('label', !!hit);
      if (hit) label.textContent = hit[1];
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

  /* ================= Portada ================= */
  function splitChars(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); return; }
          const s = document.createElement('span');
          s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName.toLowerCase() !== 'svg') walk(n);
    });
    walk(el);
    return $$('.ch', el);
  }
  const nameEl = $('#name'), chars = splitChars(nameEl);
  // cada letra salta al pasar el ratón
  nameEl.addEventListener('pointerover', e => {
    const ch = e.target.closest('.ch'); if (!ch || ch.classList.contains('jump')) return;
    ch.classList.add('jump');
    ch.addEventListener('animationend', () => ch.classList.remove('jump'), { once: true });
  });

  function heroIntro() {
    const sq = $('.squiggle');
    if (!motion) { nameEl.classList.add('names-done'); return; }
    anime.timeline({ easing: 'easeOutExpo' })
      .add({ targets: chars, translateY: ['115%', '0%'], rotate: ['9deg', '0deg'], duration: 1100, delay: anime.stagger(45) }, 0)
      .add({ targets: ['.t-name .chips', '.t-name .lead', '.t-name .cta-row'], opacity: [0, 1], translateY: [18, 0], duration: 800, delay: anime.stagger(110), complete: a => a.animatables.forEach(({ target }) => { target.style.transform = ''; }) }, 520)
      .finished.then(() => { nameEl.classList.add('names-done'); chars.forEach(c => { c.style.transform = ''; }); });
    setTimeout(() => sq && sq.classList.add('go'), 900);
  }

  // pegatinas y fotos arrastrables
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

  // reloj de Valencia
  const clockH = $('#clock-h'), clockM = $('#clock-m'), clockMsg = $('#clock-msg');
  let fmt = null;
  try { fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Madrid' }); } catch (e) {}
  function tickClock() {
    const d = new Date();
    let h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    if (fmt) { const p = fmt.formatToParts(d); h = +p.find(x => x.type === 'hour').value; m = p.find(x => x.type === 'minute').value; }
    clockH.textContent = String(h).padStart(2, '0'); clockM.textContent = m;
    clockMsg.textContent = h >= 7 && h < 14 ? 'café y código' : h >= 14 && h < 21 ? 'tarde de proyectos' : h >= 21 ? 'modo noche' : 'a dormir… o a depurar';
  }
  tickClock(); setInterval(tickClock, 15000);

  // celebración al pulsar el premio
  $('#award').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + 52, cy = r.top + r.height / 2;
    const colors = ['#e0476f', '#ffe48f', '#bfecd6', '#dacdfb', '#bfe4f6', '#ffc6d8'];
    for (let i = 0; i < 34; i++) {
      const s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 190;
      s.className = 'confetti';
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.background = colors[i % colors.length];
      s.style.setProperty('--x', Math.cos(a) * d + 'px');
      s.style.setProperty('--y', (Math.sin(a) * d - 60) + 'px');
      s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
  });

  /* ================= Revelados al entrar en pantalla ================= */
  function initReveals() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      el.classList.add('in');
      el.addEventListener('transitionend', function f(ev) { if (ev.propertyName === 'transform') { el.classList.add('done'); el.removeEventListener('transitionend', f); } });
    }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    $$('[data-r]').forEach(el => io.observe(el));
  }

  /* ================= Números que suben ================= */
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    if (!motion) return;
    el.textContent = '0';
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1100;
      const step = now => { const p = clamp((now - t0) / dur, 0, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: .6 });
    io.observe(el);
  });

  /* ================= Frase de "Sobre mí": se ilumina con el scroll ================= */
  const st = $('[data-scrub]');
  if (st && motion) {
    const text = st.textContent.trim().replace(/\s+/g, ' ');
    st.setAttribute('aria-label', text); st.textContent = '';
    const words = text.split(' ').map((w, i, a) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      st.appendChild(s); if (i < a.length - 1) st.appendChild(document.createTextNode(' '));
      return s;
    });
    const fill = raf(() => {
      const r = st.getBoundingClientRect();
      const p = clamp((innerHeight * .82 - r.top) / (innerHeight * .34), 0, 1) * words.length;
      words.forEach((w, i) => { w.style.opacity = (.16 + .84 * clamp(p - i, 0, 1)).toFixed(2); });
    });
    addEventListener('scroll', fill, { passive: true }); addEventListener('resize', fill); fill();
  }

  /* ================= Toolbox: filtro con animación FLIP ================= */
  const tools = $$('.tool'), tabs = $$('.tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const f = tab.dataset.f;
    tabs.forEach(t => t.setAttribute('aria-pressed', t === tab));
    const first = new Map(tools.map(el => [el, el.getBoundingClientRect()]));
    tools.forEach(el => { el.hidden = !(f === 'all' || el.dataset.c === f); });
    if (reduce || !tools[0].animate) return;
    tools.forEach(el => {
      if (el.hidden) return;
      const a = first.get(el), b = el.getBoundingClientRect();
      const from = a.width ? { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)`, opacity: 1 } : { transform: 'scale(.5)', opacity: 0 };
      el.animate([from, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.3,1.35,.5,1)' });
    });
  }));

  /* ================= Proyectos: al apilarse, la tarjeta anterior se encoge y se oscurece ================= */
  const cards = $$('.pcard'), wide = matchMedia('(min-width: 981px)');
  const updStack = raf(() => {
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next || !wide.matches || reduce) { c.style.transform = ''; c.style.filter = ''; return; }
      const top = parseFloat(getComputedStyle(c).top) || 96;
      const p = clamp(1 - (next.getBoundingClientRect().top - (top + 28)) / (c.offsetHeight * .8), 0, 1);
      c.style.transform = p ? `scale(${(1 - .05 * p).toFixed(4)})` : '';
      c.style.filter = p ? `brightness(${(1 - .1 * p).toFixed(3)})` : '';
    });
  });
  addEventListener('scroll', updStack, { passive: true }); addEventListener('resize', updStack); updStack();

  /* ================= Trayectoria: la línea se rellena y Goty la recorre ================= */
  const tl = $('#timeline'), rider = $('.tl-rider');
  if (rider) rider.innerHTML = botBox();
  if (tl) {
    const upd = raf(() => {
      const r = tl.getBoundingClientRect();
      tl.style.setProperty('--p', reduce ? 1 : clamp((innerHeight * .6 - r.top) / r.height, 0, 1).toFixed(4));
    });
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ================= Contacto ================= */
  const roadBot = $('.road-bot'); if (roadBot) roadBot.innerHTML = botBox();
  const toast = $('#toast'); let tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); }
  $('#copy-mail').addEventListener('click', async () => {
    const mail = 'carlafdezdh@gmail.com';
    try { await navigator.clipboard.writeText(mail); }
    catch (e) { const t = document.createElement('textarea'); t.value = mail; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) {} t.remove(); }
    say('Email copiado: ' + mail);
  });

  /* ================= Arranque ================= */
  initWipe();
  initCursor();
  const start = () => { heroIntro(); initReveals(); };
  // Sin pantalla de carga: la animación del hero arranca al momento. Solo si las fuentes
  // aún no están listas esperamos como mucho 500 ms (para que el título no cambie de tipografía a mitad de animación).
  if (motion && document.fonts && document.fonts.status !== 'loaded') Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 500))]).then(start);
  else start();
})();
