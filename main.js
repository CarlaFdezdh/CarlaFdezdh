(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasAnime = typeof anime !== 'undefined';
  const isPost = document.body.classList.contains('post-page');

  // Divide un texto en palabras con máscara (respeta <em>, <br>, <strong>...).
  function splitWords(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const mask = document.createElement('span');
          mask.className = 'w-mask';
          mask.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.className = 'w-in';
          inner.textContent = part;
          mask.appendChild(inner);
          frag.appendChild(mask);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    el.style.opacity = 1;
    return $$('.w-in', el);
  }

  // Si anime.js no carga (CDN caído, sin red...) el contenido nunca debe quedar oculto.
  if (!hasAnime) root.classList.remove('anim');

  /* ================= PÁGINA DEL ARTÍCULO ================= */
  if (isPost) {
    initPostProgress();               // navegación: no depende de anime.js ni de "reduce motion"
    if (!hasAnime || reduce) return;
    initPostMotion();
    return;
  }

  /* ================= MENÚ: sección activa, progreso y móvil =================
     No depende de anime.js ni de "reduce motion": es navegación, no decoración. */
  initNav();
  initTextFill();

  if (!hasAnime || reduce) return;
  window.__motionReady = true;
  initReveals();
  initCounters();
  initPointerFx();
  initHeadings();
  initSectionTag();
  initWipe();
  if (root.classList.contains('is-loading')) runLoader(initIntro); else initIntro();

  /* ================= CARGA: monograma + contador + cortina curva =================
     Solo en la primera visita de la sesión; al volver desde un post entra directo. */
  function runLoader(done) {
    const L = $('.loader'), count = $('.loader-count'), bar = $('.loader-bar');
    const o = { v: 0 };
    try { sessionStorage.setItem('cf-seen', '1'); } catch (e) {}
    anime({ targets: '.lm-in', translateY: ['110%', '0%'], duration: 1100, delay: 150, easing: 'easeOutExpo' });
    anime({ targets: '.loader-meta', opacity: [0, 1], duration: 700, delay: 300, easing: 'linear' });
    anime({
      targets: o, v: 100, duration: 1900, delay: 200, easing: 'easeInOutQuart', round: 1,
      update: () => { count.textContent = String(o.v).padStart(3, '0'); bar.style.transform = `scaleX(${o.v / 100})`; },
      complete: () => Promise.race([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 1200))]).then(exit)
    });
    function exit() {
      setTimeout(done, 820); // el hero arranca cuando la cortina va por la mitad
      anime.timeline({ easing: 'easeInOutExpo' })
        .add({ targets: ['.loader-meta', '.loader-bar'], opacity: 0, duration: 300, easing: 'linear' }, 0)
        .add({ targets: '.lm-in', translateY: ['0%', '-110%'], duration: 750 }, 0)
        .add({ targets: L, translateY: ['0%', '-120%'], duration: 1150, complete: () => { L.remove(); root.classList.remove('is-loading'); } }, 380);
    }
  }

  /* ================= TRANSICIÓN ENTRE SECCIONES (clic en el menú) ================= */
  function initWipe() {
    const W = $('.wipe'); if (!W) return;
    const A = $('.wp-a', W), B = $('.wp-b', W), lab = $('.wipe-label', W), num = $('.wipe-num', W);
    const names = { '#top': ['00', 'Inicio'], '#story': ['01', 'Sobre mí'], '#work': ['03', 'Trabajo'], '#journey': ['04', 'Trayectoria'], '#contact': ['07', 'Contacto'] };
    let busy = false;
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const href = a.getAttribute('href'), info = names[href], target = info && $(href);
      if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      if (busy) return;
      busy = true;
      lab.textContent = info[1]; num.textContent = info[0];
      W.classList.add('on');
      anime.set([A, B], { translateY: '112%' });
      anime.set(lab, { translateY: '110%' });
      anime.set(num, { opacity: 0 });
      anime.timeline({ easing: 'easeInOutExpo' })
        .add({ targets: A, translateY: '0%', duration: 700 }, 0)
        .add({ targets: B, translateY: '0%', duration: 700 }, 110)
        .add({ targets: lab, translateY: '0%', duration: 800, easing: 'easeOutExpo' }, 560)
        .add({ targets: num, opacity: 1, duration: 400, easing: 'linear' }, 620)
        .finished.then(() => {
          const sm = parseInt(getComputedStyle(target).scrollMarginTop) || 0;
          scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + scrollY - sm), behavior: 'instant' });
          history.replaceState(null, '', href);
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          return new Promise(r => setTimeout(r, 280));
        }).then(() => anime.timeline({ easing: 'easeInOutExpo' })
          .add({ targets: lab, translateY: '-110%', duration: 600 }, 0)
          .add({ targets: num, opacity: 0, duration: 300, easing: 'linear' }, 0)
          .add({ targets: B, translateY: '-112%', duration: 800 }, 150)
          .add({ targets: A, translateY: '-112%', duration: 800 }, 270).finished)
        .then(() => { W.classList.remove('on'); busy = false; });
    });
  }

  /* ================= INDICADOR DE SECCIÓN (rueda al cambiar) ================= */
  function initSectionTag() {
    const tag = $('.section-tag'); if (!tag) return;
    const nEl = $('.st-num i', tag), tEl = $('.st-name i', tag);
    const secs = [['.intro-strip', '01', 'Sobre mí'], ['.skills-new', '02', 'Toolbox'], ['.work-section', '03', 'Trabajo'], ['.journey-section', '04', 'Trayectoria'], ['.human-section', '05', 'Más allá'], ['.journal-section', '06', 'Journal'], ['.contact-new', '07', 'Contacto']]
      .map(([s, n, t]) => ({ el: $(s), n, t })).filter(x => x.el);
    let cur = -2, ticking = false;
    const set = i => { nEl.textContent = secs[i].n; tEl.textContent = secs[i].t; };
    const change = i => {
      const prev = cur; cur = i;
      anime.remove([tag, nEl, tEl]);
      if (i < 0) { anime({ targets: tag, opacity: 0, duration: 400, easing: 'easeOutQuad' }); return; }
      if (prev < 0) {
        set(i);
        anime({ targets: tag, opacity: 1, duration: 500, easing: 'linear' });
        anime({ targets: [nEl, tEl], translateY: ['110%', '0%'], duration: 800, delay: anime.stagger(70), easing: 'easeOutExpo' });
        return;
      }
      const d = i > prev ? 1 : -1;
      anime({ targets: [nEl, tEl], translateY: ['0%', -110 * d + '%'], duration: 320, delay: anime.stagger(40), easing: 'easeInQuad',
        complete: () => { set(i); anime({ targets: [nEl, tEl], translateY: [110 * d + '%', '0%'], duration: 750, delay: anime.stagger(60), easing: 'easeOutExpo' }); } });
    };
    const onScroll = () => {
      ticking = false;
      let idx = -1;
      secs.forEach((s, k) => { if (s.el.getBoundingClientRect().top <= innerHeight * .45) idx = k; });
      if (idx !== cur) change(idx);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ================= TITULARES: palabra a palabra desde una máscara ================= */
  function initHeadings() {
    $$('.skills-heading h2,.work-top h2,.journey-heading h2,.human-grid h2,.journal-heading h2,.contact-new h2').forEach(h => {
      const words = splitWords(h);
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        anime({ targets: words, translateY: ['115%', '0%'], rotate: ['4deg', '0deg'], duration: 1150, delay: anime.stagger(60), easing: 'easeOutExpo' });
      }, { threshold: .4 });
      io.observe(h);
    });
  }

  /* ================= TEXTO CON REVELADO DE COLOR AL HACER SCROLL =================
     Efecto insignia: la frase "No me limito a escribir código..." pasa de gris
     apagado a tinta sólida a medida que se lee, como una especie de resaltado
     que sigue la vista. Funciona sin anime.js; con "reduce motion" queda fijo. */
  function initTextFill() {
    const el = $('.big-statement');
    if (!el) return;
    el.classList.add('scroll-fill');
    if (reduce) { el.style.setProperty('--p', '100%'); return; }
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const start = innerHeight * .82;
      const span = r.height + innerHeight * .28;
      const p = Math.max(0, Math.min(1, (start - r.top) / span));
      el.style.setProperty('--p', (p * 100).toFixed(1) + '%');
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  function initNav() {
    const header = $('#main-nav');
    if (!header) return;
    const links = $$('nav a', header);
    const pill = $('.nav-pill', header);
    const menu = $('#mobile-menu');
    const toggle = $('.nav-toggle', header);
    const mLinks = $$('a', menu);
    const targets = links.map(a => $(a.getAttribute('href')));
    let active = -1, ticking = false;

    const setActive = i => {
      links.forEach((a, k) => a.classList.toggle('is-active', k === i));
      mLinks.forEach((a, k) => a.classList.toggle('is-active', k === i));
      if (i < 0) { pill.style.opacity = 0; return; }
      const a = links[i];
      if (a.offsetWidth === 0) return; // nav oculto en móvil
      if (pill.style.opacity !== '1') { // primera aparición: colocar sin deslizar desde 0
        pill.style.transition = 'none';
        pill.style.left = a.offsetLeft + 'px';
        pill.style.width = a.offsetWidth + 'px';
        void pill.offsetWidth;
        pill.style.transition = '';
      } else {
        pill.style.left = a.offsetLeft + 'px';
        pill.style.width = a.offsetWidth + 'px';
      }
      pill.style.opacity = 1;
    };

    const onScroll = () => {
      ticking = false;
      const y = scrollY, max = root.scrollHeight - innerHeight;
      header.style.setProperty('--p', max > 0 ? Math.min(1, y / max) : 0);
      header.classList.toggle('is-scrolled', y > 40);
      const line = innerHeight * .35;
      let idx = -1;
      targets.forEach((t, k) => { if (t && t.getBoundingClientRect().top <= line) idx = k; });
      if (max > 0 && y >= max - 4) idx = targets.length - 1;
      if (idx !== active) { active = idx; setActive(idx); }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', () => { pill.style.transition = 'none'; setActive(active); void pill.offsetWidth; pill.style.transition = ''; });
    onScroll();

    const setMenu = open => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    mLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', e => { if (!menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false); });
    matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  /* ================= ENTRADA: una única secuencia orquestada ================= */
  function initIntro() {
    // Cada línea del título sube desde detrás de una máscara.
    $$('.hero-line').forEach(line => {
      const inner = document.createElement('span');
      inner.className = 'line-inner';
      inner.innerHTML = line.innerHTML;
      const mask = document.createElement('span');
      mask.className = 'line-mask';
      mask.appendChild(inner);
      line.innerHTML = '';
      line.appendChild(mask);
      line.style.opacity = 1;
    });

    anime.timeline({ easing: 'easeOutExpo' })
      .add({ targets: '.site-header', opacity: [0, 1], translateY: [-26, 0], duration: 900 }, 0)
      .add({ targets: '.line-inner', translateY: ['112%', '0%'], duration: 1250, delay: anime.stagger(150) }, 120)
      .add({ targets: '.hero-reveal', opacity: [0, 1], translateY: [18, 0], duration: 900, delay: anime.stagger(110) }, 500)
      .add({ targets: '.portrait-frame', opacity: [0, 1], scale: [.94, 1], rotate: ['-3deg', '0deg'], duration: 1400, easing: 'easeOutElastic(1,.75)' }, 250)
      .add({ targets: '.portrait-ring', opacity: [0, 1], rotate: [-25, 25], duration: 1800, easing: 'easeOutCubic' }, 400)
      .add({ targets: '.portrait-number', opacity: [0, 1], scale: [0, 1], duration: 700, easing: 'easeOutBack' }, 900)
      .add({ targets: '.portrait-sticker', opacity: [0, 1], scale: [0, 1], rotate: ['-20deg', '8deg'], duration: 900, easing: 'easeOutBack' }, 1050)
      .add({ targets: '.hero-caption', opacity: [0, 1], duration: 900, easing: 'easeOutCubic' }, 1300);

    // Indicador de scroll: se anima solo hasta que la persona empieza a hacer scroll.
    const cue = anime({ targets: '.scroll-line i', translateX: [-45, 120], duration: 1800, delay: 1500, loop: true, easing: 'easeInOutSine' });
    addEventListener('scroll', () => { if (scrollY > 80) cue.pause(); }, { passive: true });
  }

  /* ================= REVELADO POR GRUPOS (con escalonado) ================= */
  const settle = a => a.animatables.forEach(({ target }) => {
    target.style.transform = '';
    target.classList.add('settled');
    if (target.matches('.project-feature,.project-mini,.project-wide,.journal-card')) target.classList.add('is-ready');
  });
  const run = (targets, opts) => anime({ targets, opacity: [0, 1], ...opts, complete: settle });

  function initReveals() {
    const groups = [
      { box: '.numbers-grid', o: { translateY: [26, 0], duration: 900, delay: anime.stagger(100), easing: 'easeOutExpo' } },
      { box: '.skills-cloud', o: { translateY: [18, 0], scale: [.7, 1], duration: 800, delay: anime.stagger(50), easing: 'easeOutBack' } },
      { box: '.project-bento', o: { translateY: [40, 0], duration: 1000, delay: anime.stagger(120), easing: 'easeOutExpo' } },
      { box: '.journey-list', o: { translateX: [-24, 0], duration: 900, delay: anime.stagger(110), easing: 'easeOutExpo' } }
    ];
    const grouped = new Set();
    groups.forEach(({ box, o }) => {
      const el = $(box); if (!el) return;
      const items = $$('.reveal', el);
      items.forEach(i => grouped.add(i));
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        run(items, o);
      }, { threshold: .15 });
      io.observe(el);
    });

    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      run(en.target, { translateY: [30, 0], duration: 900, easing: 'easeOutExpo' });
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').filter(el => !grouped.has(el)).forEach(el => io.observe(el));
  }

  /* ================= CONTADORES ================= */
  function initCounters() {
    const els = $$('[data-count]');
    els.forEach(el => { el.textContent = '0'; });
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target, o = { v: 0 };
      anime({ targets: o, v: +el.dataset.count, duration: 1600, easing: 'easeOutExpo', round: 1, update: () => { el.textContent = o.v; } });
    }), { threshold: .6 });
    els.forEach(el => io.observe(el));
  }

  /* ================= EFECTOS DE PUNTERO (solo ratón/trackpad) ================= */
  function initPointerFx() {
    // Parallax de fondo: propiedad "translate", no pisa las animaciones con transform.
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = scrollY;
        const a = $('.orb-one'), b = $('.orb-two');
        if (a) a.style.translate = `0 ${y * .035}px`;
        if (b) b.style.translate = `0 ${-y * .025}px`;
      });
    }, { passive: true });

    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    // Hero: las piezas del retrato se mueven a distinta profundidad, y un foco
    // de luz suave sigue al cursor por detrás de todo el contenido.
    const hero = $('.hero-new');
    const glow = $('.hero-glow');
    const layers = [['.portrait-number', -16], ['.portrait-sticker', 24], ['.portrait-ring', -10], ['.hero-caption', 14], ['.portrait-frame img', 8]]
      .map(([s, d]) => { const el = $(s); if (el) el.setAttribute('data-depth', d); return el && [el, d]; }).filter(Boolean);
    if (hero) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        layers.forEach(([el, d]) => { el.style.translate = `${nx * d}px ${ny * d}px`; });
        if (glow) { glow.style.setProperty('--mx', (e.clientX - r.left) + 'px'); glow.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      });
      hero.addEventListener('pointerleave', () => layers.forEach(([el]) => { el.style.translate = '0 0'; }));
    }

    // Tarjetas: inclinación 3D suave, foco de luz y parallax de la imagen.
    $$('.project-feature,.project-mini,.project-wide,.journal-card').forEach(card => {
      const max = card.matches('.project-feature,.journal-card') ? 5 : 3;
      card.addEventListener('pointermove', e => {
        if (!card.classList.contains('is-ready')) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - .5) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - py) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        card.style.setProperty('--nx', (px - .5).toFixed(3));
        card.style.setProperty('--ny', (py - .5).toFixed(3));
      });
      card.addEventListener('pointerleave', () => {
        ['--rx', '--ry'].forEach(v => card.style.setProperty(v, '0deg'));
        ['--nx', '--ny'].forEach(v => card.style.setProperty(v, 0));
      });
    });

    // Botones magnéticos.
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        anime.remove(btn);
        anime({ targets: btn, translateX: (e.clientX - r.left - r.width / 2) * .14, translateY: (e.clientY - r.top - r.height / 2) * .14, duration: 250, easing: 'easeOutQuad' });
      });
      btn.addEventListener('mouseleave', () => anime({ targets: btn, translateX: 0, translateY: 0, duration: 600, easing: 'easeOutElastic(1,.55)' }));
    });
  }

  /* =====================================================================
     POST: progreso de lectura, índice lateral y salida de página
     ===================================================================== */
  function initPostProgress() {
    const links = $$('.post-toc-list a');
    const ind = $('.post-toc-ind');
    const targets = links.map(a => $(a.getAttribute('href')));
    let active = -2, ticking = false;

    const place = i => {
      if (!ind) return;
      if (i < 0) { ind.style.opacity = 0; return; }
      const a = links[i];
      ind.style.opacity = 1;
      ind.style.height = a.offsetHeight + 'px';
      ind.style.transform = `translateY(${a.offsetTop}px)`;
    };

    const onScroll = () => {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      root.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
      const line = innerHeight * .4;
      let idx = -1;
      targets.forEach((t, k) => { if (t && t.getBoundingClientRect().top <= line) idx = k; });
      if (idx !== active) {
        active = idx;
        links.forEach((a, k) => a.classList.toggle('is-active', k === idx));
        place(idx);
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', () => place(active));
    onScroll();

    // Si la barra lateral es más alta que la ventana, se ancla por abajo: así
    // se ve entera según se avanza en el artículo, sin scroll interno.
    const sb = $('.post-sidebar');
    const setSbTop = () => { if (sb) sb.style.setProperty('--sb-top', Math.min(88, innerHeight - sb.offsetHeight - 24) + 'px'); };
    setSbTop();
    addEventListener('resize', setSbTop);
    addEventListener('load', setSbTop);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setSbTop);

    // Salida suave al volver al listado.
    const back = $('.post-back');
    if (back && !reduce) {
      back.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        document.body.classList.add('is-leaving');
        setTimeout(() => { location.href = back.href; }, 320);
      });
      addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('is-leaving'); });
    }
  }

  /* =====================================================================
     POST: movimiento. Un momento orquestado (portada + título) y después
     cada bloque se revela con su propio gesto, según lo que es.
     ===================================================================== */
  function initPostMotion() {
    window.__motionReady = true;
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // Quita los transform inline al terminar, para que los :hover de CSS vuelvan a mandar.
    const settle = el => { el.style.transform = ''; el.classList.add('settled'); };
    const clear = a => a.animatables.forEach(({ target }) => settle(target));

    const once = (el, fn, opts) => {
      if (!el) return;
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        fn(el);
      }, opts || { threshold: .15, rootMargin: '0px 0px -8% 0px' });
      io.observe(el);
    };


    /* ---------- 1. Portada: la secuencia de entrada ---------- */
    const hero = $('.post-hero');
    const heroInner = $('.post-hero-inner');
    const titleWords = splitWords($('.post-title'));
    setTimeout(() => $('.post-eyebrow').classList.add('is-drawn'), 250);

    const tl = anime.timeline({ easing: 'easeOutExpo' })
      .add({ targets: '.post-back', opacity: [0, 1], translateX: [-20, 0], duration: 900 }, 200)
      .add({ targets: '.post-eyebrow', opacity: [0, 1], duration: 700 }, 250)
      .add({ targets: titleWords, translateY: ['115%', '0%'], rotate: ['5deg', '0deg'], duration: 1300, delay: anime.stagger(90) }, 350)
      .add({ targets: '.post-intro', opacity: [0, 1], translateY: [20, 0], duration: 1000 }, 950)
      .add({ targets: '.post-pill', opacity: [0, 1], translateY: [14, 0], scale: [.9, 1], duration: 900, delay: anime.stagger(90), easing: 'easeOutBack' }, 1100)
      .add({ targets: '.post-summary', opacity: [0, 1], translateY: [70, 0], duration: 1300 }, 1000)
      .add({ targets: '.post-summary-item', opacity: [0, 1], translateY: [14, 0], duration: 900, delay: anime.stagger(110) }, 1350);
    tl.finished.then(() => $$('.post-back,.post-eyebrow,.post-intro,.post-pill,.post-summary,.post-summary-item').forEach(settle));

    // Parallax de la portada y desvanecido del título al bajar.
    let tick = false;
    addEventListener('scroll', () => {
      if (tick) return; tick = true;
      requestAnimationFrame(() => {
        tick = false;
        const y = scrollY, h = hero.offsetHeight;
        if (y > h * 1.2) return;
        hero.style.setProperty('--shift', (y * .22).toFixed(1) + 'px');
        heroInner.style.translate = `0 ${(y * .12).toFixed(1)}px`;
        heroInner.style.opacity = Math.max(0, 1 - y / (h * .85)).toFixed(3);
      });
    }, { passive: true });

    // Foco de luz que sigue al cursor sobre la portada.
    if (fine) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    }

    /* ---------- 2. Secciones: etiqueta, titular por palabras, párrafos ---------- */
    $$('.post-section').forEach(sec => {
      const label = $('.post-section-label', sec);
      const words = splitWords($('h2', sec));
      const paras = $$(':scope > p', sec);
      once(sec, () => {
        sec.classList.add('is-drawn');
        label.classList.add('is-drawn');
        anime.timeline({ easing: 'easeOutExpo' })
          .add({ targets: label, opacity: [0, 1], translateX: [-14, 0], duration: 800 }, 0)
          .add({ targets: words, translateY: ['110%', '0%'], rotate: ['4deg', '0deg'], duration: 1100, delay: anime.stagger(55) }, 120)
          .add({ targets: paras, opacity: [0, 1], translateY: [18, 0], duration: 900, delay: anime.stagger(110) }, 450);
      }, { threshold: .05, rootMargin: '0px 0px -14% 0px' });
    });

    /* ---------- 3. Tarjeta del robot: se abre como una cortina ---------- */
    const card = $('.post-feature-card');
    // El IntersectionObserver no "ve" un elemento recortado por su propio clip-path,
    // así que se observa un contenedor (sus márgenes se colapsan: el layout no cambia).
    if (card) {
      const wrap = document.createElement('div');
      card.before(wrap);
      wrap.appendChild(card);
    }
    once(card && card.parentElement, () => {
      const c = card;
      c.classList.add('is-in');
      const done = () => c.classList.add('is-done');
      c.addEventListener('transitionend', e => { if (e.propertyName === 'clip-path') done(); });
      setTimeout(done, 1900);
      anime({ targets: $$('.post-feature-body > *', c), opacity: [0, 1], translateY: [18, 0], duration: 900, delay: anime.stagger(90, { start: 600 }), easing: 'easeOutExpo', complete: clear });
      anime({ targets: $$('.post-chip', c), opacity: [0, 1], scale: [.6, 1], duration: 700, delay: anime.stagger(70, { start: 1000 }), easing: 'easeOutBack', complete: clear });
    }, { threshold: .25 });

    if (fine && card) {
      card.addEventListener('pointermove', e => {
        if (!card.classList.contains('is-done')) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - .5) * 6).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - py) * 6).toFixed(2) + 'deg');
        card.style.setProperty('--nx', (px - .5).toFixed(3));
        card.style.setProperty('--ny', (py - .5).toFixed(3));
      });
      card.addEventListener('pointerleave', () => {
        ['--rx', '--ry'].forEach(v => card.style.setProperty(v, '0deg'));
        ['--nx', '--ny'].forEach(v => card.style.setProperty(v, 0));
      });
    }

    /* ---------- 4. Aprendizajes: entran en cadena, el número gira ---------- */
    once($('.post-learnings'), box => {
      anime({ targets: $$('.post-learning', box), opacity: [0, 1], translateX: [-34, 0], duration: 1000, delay: anime.stagger(130), easing: 'easeOutExpo', complete: clear });
      anime({ targets: $$('.post-learning-num', box), scale: [0, 1], rotate: ['-120deg', '0deg'], duration: 900, delay: anime.stagger(130, { start: 250 }), easing: 'easeOutBack' });
    }, { threshold: .2 });

    /* ---------- 5. Cita: se ilumina palabra a palabra con el scroll ---------- */
    const quote = $('.post-quote');
    if (quote) {
      const p1 = $('p:first-child', quote);
      const raw = p1.textContent.replace(/\s+/g, ' ').trim();
      p1.setAttribute('aria-label', raw);
      p1.textContent = '';
      raw.split(' ').forEach((w, i, arr) => {
        const s = document.createElement('span');
        s.className = 'q-w';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = w;
        p1.appendChild(s);
        if (i < arr.length - 1) p1.appendChild(document.createTextNode(' '));
      });
      const qw = $$('.q-w', p1);
      let qt = false;
      const fill = () => {
        qt = false;
        const r = quote.getBoundingClientRect();
        const p = clamp((innerHeight * .85 - r.top) / (innerHeight * .45), 0, 1);
        const lit = p * qw.length;
        qw.forEach((w, i) => { w.style.opacity = (.2 + .8 * clamp(lit - i, 0, 1)).toFixed(2); });
      };
      addEventListener('scroll', () => { if (!qt) { qt = true; requestAnimationFrame(fill); } }, { passive: true });
      addEventListener('resize', fill);
      fill();
      once(quote, q => {
        q.classList.add('is-in');
        anime({ targets: $('p:last-child', q), opacity: [0, 1], translateX: [-12, 0], duration: 900, delay: 700, easing: 'easeOutExpo' });
      }, { threshold: .35 });
    }

    /* ---------- 6. Barra lateral ---------- */
    once($('.post-sidebar'), sb => {
      anime({ targets: $$('.post-side-card', sb), opacity: [0, 1], translateY: [30, 0], duration: 1000, delay: anime.stagger(110), easing: 'easeOutExpo', complete: clear });
      anime({ targets: $$('.post-fact', sb), opacity: [0, 1], translateX: [14, 0], duration: 700, delay: anime.stagger(70, { start: 600 }), easing: 'easeOutExpo', complete: clear });
      anime({ targets: $$('.post-small-tag', sb), opacity: [0, 1], scale: [.7, 1], duration: 700, delay: anime.stagger(50, { start: 800 }), easing: 'easeOutBack', complete: clear });
      anime({ targets: $$('.post-avatar', sb), scale: [.6, 1], rotate: ['-25deg', '0deg'], duration: 1200, delay: 250, easing: 'easeOutElastic(1,.7)' });
    }, { threshold: .05, rootMargin: '0px' });

    /* ---------- 7. Pie ---------- */
    once($('.post-footer'), f => {
      f.classList.add('is-in');
      anime({ targets: $$('.post-footer-inner p', f), opacity: [0, 1], translateY: [16, 0], duration: 900, easing: 'easeOutExpo' });
      anime({ targets: $$('.post-footer-badge', f), opacity: [0, 1], scale: [.8, 1], duration: 1100, delay: 200, easing: 'easeOutElastic(1,.6)' });
    }, { threshold: .3, rootMargin: '0px' });
  }
})();
