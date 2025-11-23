
/* DOM */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));




/* Parallax tilt + floating depth for project cards */
(function projectParallaxInit() {
  const items = $$('.project-item');
  if (!items || items.length === 0) return;

  const maxTilt = 14;
  const sensitivity = 1.5; 
  const baseInner = 60; 
  const extraInner = 50;
  const baseLogo = 90;
  const extraLogo = 80;

  items.forEach(item => {
    const card = item.querySelector('.card');
    const inner = item.querySelector('.front .inner') || item.querySelector('.front');
    const logo = item.querySelector('.project-logo');

    if (inner) {
      inner.style.setProperty('--z', baseInner + 'px');
    }
    if (logo) {
      logo.style.setProperty('--logo-z', baseLogo + 'px');
    }
    item.style.setProperty('--overlay-z', '40px');

    let raf = null;
    let state = { rx: 0, ry: 0, iz: baseInner, lz: baseLogo };

    const apply = () => {
      // apply rotation to the card element (tilt)
      if (card) card.style.transform = `rotateX(${state.rx}deg) rotateY(${state.ry}deg)`;
      // apply depth vars to inner and logo via CSS vars (they already use var(--z)/--logo-z)
      if (inner) inner.style.setProperty('--z', Math.round(state.iz) + 'px');
      if (logo) logo.style.setProperty('--logo-z', Math.round(state.lz) + 'px');
      raf = null;
    };

    const onPointerMove = (e) => {
      // ignore touch pointer types; handle touch via tap-to-flip already
      if (e.pointerType === 'touch') return;
      const rect = item.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const px = (e.clientX - cx) / (rect.width/2);
      const py = (e.clientY - cy) / (rect.height/2);
      const clampedX = Math.max(-1, Math.min(1, px));
      const clampedY = Math.max(-1, Math.min(1, py));

      // amplify small pointer deltas so slight movements produce noticeable tilt
      state.ry = clampedX * maxTilt * sensitivity; // rotateY
      state.rx = -clampedY * maxTilt * sensitivity; // rotateX (invert so pointer up -> tilt towards user)

      const mag = Math.min(1, Math.sqrt(clampedX*clampedX + clampedY*clampedY));
      state.iz = baseInner + mag * extraInner;
      state.lz = baseLogo + mag * extraLogo;

      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onPointerEnter = (e) => {
      // make the card respond quicker to small movements
      if (card) card.style.transition = 'transform 100ms ease';
      if (inner) inner.style.transition = 'transform 100ms ease';
      if (logo) logo.style.transition = 'transform 100ms ease';
    };

    const onPointerLeave = (e) => {
      // reset
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      state = { rx: 0, ry: 0, iz: baseInner, lz: baseLogo };
      if (card) { card.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1)'; card.style.transform = 'rotateX(0deg) rotateY(0deg)'; }
      if (inner) { inner.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1)'; inner.style.setProperty('--z', baseInner + 'px'); }
      if (logo) { logo.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1)'; logo.style.setProperty('--logo-z', baseLogo + 'px'); }
    };

    // pointer events (works for mouse & stylus). Ignore touch pointer moves.
    item.addEventListener('pointermove', onPointerMove);
    item.addEventListener('pointerenter', onPointerEnter);
    item.addEventListener('pointerleave', onPointerLeave);

    // also reset on touchend/cancel to avoid stuck transforms
    item.addEventListener('touchend', onPointerLeave);
    item.addEventListener('touchcancel', onPointerLeave);
  });
})();

/* Resume download: attempt to download a bundled PDF if present, otherwise fall back to Drive link */
(function resumeDownloadInit() {
  const dl = document.getElementById('downloadResume');
  if (!dl) return;

  const localPath = 'assets/Atheer_Resume.pdf';
  const fallback = dl.getAttribute('href');

  dl.addEventListener('click', async (e) => {
    // let normal behavior occur for modifier clicks
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    try {
      // try to fetch the local file
      const res = await fetch(localPath);
      if (!res.ok) throw new Error('no local');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Atheer_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    } catch (err) {
      // If the fallback is a Google Drive file link, try to derive a direct download URL
      try {
        const driveUrl = fallback || '';
        let fileId = null;
        // match /file/d/FILEID
        const m1 = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (m1 && m1[1]) fileId = m1[1];
        // match ?id=FILEID or &id=FILEID
        if (!fileId) {
          const m2 = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (m2 && m2[1]) fileId = m2[1];
        }

        if (fileId) {
          const dlUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          // navigate in the same tab to trigger download; allow modifier keys to open new tab
          window.location.href = dlUrl;
        } else {
          // not a direct file link (e.g., a folder) — open the original fallback in a new tab
          window.open(fallback, '_blank', 'noopener');
        }
      } catch (e) {
        window.open(fallback, '_blank', 'noopener');
      }
    }
  });
})();

/* Nav indicator: animated sliding underline for current nav item */
(function navIndicatorInit() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = Array.from(nav.querySelectorAll('a'));
  if (links.length === 0) return;

  // create indicator element
  const indicator = document.createElement('div');
  indicator.className = 'nav-indicator';
  nav.appendChild(indicator);

  const navRect = () => nav.getBoundingClientRect();

  function placeIndicator(el, animate = true) {
    if (!el) return;
    const n = navRect();
    const r = el.getBoundingClientRect();
    const left = (r.left - n.left) + nav.scrollLeft;
    const width = Math.max(8, r.width);
    if (prefersReduced || !animate) {
      indicator.style.transition = 'none';
      indicator.style.left = left + 'px';
      indicator.style.width = width + 'px';
      // force reflow then restore transition
      void indicator.offsetWidth;
      indicator.style.transition = '';
    } else {
      indicator.style.left = left + 'px';
      indicator.style.width = width + 'px';
    }
  }

  // determine current page and active link
  const page = (location.pathname.split('/').pop() || 'index.html');
  let active = links.find(a => {
    const href = a.getAttribute('href');
    if (!href) return false;
    // match exact filename or trailing pathname
    return href === page || a.href.endsWith('/' + page) || a.href.endsWith(page);
  }) || links[0];

  // initial placement without animation
  placeIndicator(active, false);

  // animate on click then navigate
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      // move indicator visually
      placeIndicator(link, true);
      // navigate after animation completes (short delay)
      setTimeout(() => { window.location.href = href; }, 280);
    });
  });

  // reposition on resize (no animation)
  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => placeIndicator(active, false), 120);
  });

  // if user navigates via history buttons, update active
  window.addEventListener('popstate', () => {
    const newPage = (location.pathname.split('/').pop() || 'index.html');
    active = links.find(a => a.getAttribute('href') === newPage) || links[0];
    placeIndicator(active, false);
  });

})();

/* Background decorations: blobs, SVG shapes, and small particles */
(function backgroundDecorInit() {
  // Respect reduced motion
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Create container
  const decor = document.createElement('div');
  decor.className = 'bg-decor';
  document.body.appendChild(decor);

  // Create blobs
  const blobColors = [
    getComputedStyle(document.documentElement).getPropertyValue('--accent-color') || '#254B8A',
    getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#12355A',
    getComputedStyle(document.documentElement).getPropertyValue('--success-color') || '#1E5FA8',
    getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#0B2138'
  ];

  for (let i = 0; i < 4; i++) {
    const b = document.createElement('div');
    b.className = `blob blob-${i+1}`;
    b.style.background = blobColors[i].trim() || blobColors[i];
    if (prefersReduced) b.style.animation = 'none';
    decor.appendChild(b);
  }

  // Inject a few SVG shapes for subtle geometry
  const svgPaths = [
    { fill: blobColors[0], rotate: 0 },
    { fill: blobColors[1], rotate: 120 },
    { fill: blobColors[2], rotate: 240 }
  ];
  svgPaths.forEach((s, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'svg-shape';
    wrapper.style.inset = '0';
    wrapper.style.position = 'absolute';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.zIndex = '-3';
    wrapper.innerHTML = `<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><path fill="${s.fill.trim()}" d="M800,500Q700,600,600,650Q500,700,400,650Q300,600,200,500Q100,400,150,300Q200,200,300,150Q400,100,500,150Q600,200,650,300Q700,400,800,500Z" transform="rotate(${s.rotate} 500 500)"/></svg>`;
    if (prefersReduced) wrapper.style.animation = 'none';
    decor.appendChild(wrapper);
  });

  // Particles (small dots)
  const particles = document.createElement('div');
  particles.id = 'particles-js';
  document.body.appendChild(particles);

  if (!prefersReduced) {
    const count = 50;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 1; // 1..5
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.opacity = String(0.08 + Math.random() * 0.18);
      const dur = 12 + Math.random() * 20;
      const delay = Math.random() * 8;
      p.style.animation = `floatParticle ${dur}s ease-in-out ${delay}s infinite`;
      particles.appendChild(p);
    }

    // Add floatParticle keyframes dynamically so each run uses consistent values
    const style = document.createElement('style');
    style.textContent = `@keyframes floatParticle { 0%{transform:translate(0,0);} 25%{transform:translate(20px,-12px);}50%{transform:translate(-10px,18px);}75%{transform:translate(6px,6px);}100%{transform:translate(0,0);} }`;
    document.head.appendChild(style);
  }

  // Animated dot field (CodePen-inspired) — generate wrappers + tiny dots
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'bg-dots';
  document.body.appendChild(dotsContainer);

  // Increase dots for a denser field; be mindful of performance on low-end devices
  const dotsCount = 220;
  if (prefersReduced) {
    // create a reduced, static set for users who prefer less motion
    for (let i = 0; i < 16; i++) {
      const w = document.createElement('div');
      w.className = `dotWrapper dotWrapper-${i+1}`;
      w.style.top = `${Math.random() * 100}%`;
      w.style.left = `${Math.random() * 100}%`;
      const d = document.createElement('div');
      d.className = `dot dot-${i+1}`;
      const size = Math.round(2 + Math.random() * 4);
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;
      d.style.background = 'var(--dot-color)';
      w.appendChild(d);
      dotsContainer.appendChild(w);
    }
  } else {
    for (let i = 0; i < dotsCount; i++) {
      const w = document.createElement('div');
      w.className = `dotWrapper dotWrapper-${i+1}`;
      w.style.top = `${Math.random() * 100}%`;
      w.style.left = `${Math.random() * 100}%`;
      // flying duration between ~20s and ~70s, random negative delay for natural staggering
      const flyDur = 20 + Math.random() * 50;
      const flyDelay = -(Math.random() * 10);
      w.style.animation = `flying ${flyDur}s ease-in-out ${flyDelay}s infinite alternate`;

      const d = document.createElement('div');
      d.className = `dot dot-${i+1}`;
      const size = (Math.random() * 3) + 2; // 2..5px
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;
      // rotating duration between 10s and 30s
      const rotDur = 10 + Math.random() * 20;
      const rotDelay = -(Math.random() * 10);
      d.style.animation = `rotating ${rotDur}s ease-in-out ${rotDelay}s infinite`;
      // random transform-origin to make rotations feel organic
      const ox = Math.round((Math.random() * 30) - 15) + 'px';
      const oy = Math.round((Math.random() * 30) - 15) + 'px';
      d.style.transformOrigin = `${ox} ${oy}`;
      d.style.background = 'var(--dot-color)';

      w.appendChild(d);
      dotsContainer.appendChild(w);
    }
  }

  // Ensure glass overlay is applied to inner containers (not full-width sections)
  // Remove accidental application on full-width sections if present
  document.querySelectorAll('section').forEach(s => s.classList.remove('glass-applied'));

  // Apply glass style to section's inner `.container` where available
  document.querySelectorAll('section').forEach(section => {
    const inner = section.querySelector('.container');
    if (!inner) return;
    // Skip applying the full-panel glass on the Projects page so individual cards
    // can present as the single frosted rectangle that flips.
    const page = window.location.pathname.split('/').pop();
    if (page === 'projects.html') {
      // do not add glass-applied to the section inner on projects page
    } else {
      inner.classList.add('glass-applied');
    }
  });

  // Also apply to project cards and stats cards themselves
  document.querySelectorAll('.project-item, .stats-card').forEach(el => el.classList.add('glass-applied'));

})();

/* Header: mobile nav toggle and theme toggle placeholder */
(function headerInit() {
  const nav = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const themeToggle = document.getElementById('themeToggle');
  const THEME_KEY = 'theme';

  function ensureThemeIcon() {
    if (!themeToggle) return null;
    let img = themeToggle.querySelector('.theme-icon');
    if (!img) {
      img = document.createElement('img');
      img.className = 'theme-icon';
      img.src = 'assets/images/dark-mode.png';
      img.alt = '';
      // Remove any other content (emoji/text) so only the image remains
      while (themeToggle.firstChild) themeToggle.removeChild(themeToggle.firstChild);
      themeToggle.appendChild(img);
    } else {
      // Remove any other children besides the image (in case pages include emoji/text in HTML)
      Array.from(themeToggle.children).forEach(child => { if (child !== img) themeToggle.removeChild(child); });
    }
    return img;
  }

  function applyTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(name === 'dark'));
      themeToggle.title = name === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

      // Ensure a single <img> exists inside the button and update its state.
      const img = ensureThemeIcon();
      if (img) {
        img.alt = name === 'dark' ? 'Dark mode active' : 'Toggle dark mode';
        // Keep the same asset for both states; we toggle rotation via CSS.
        img.src = 'assets/images/dark-mode.png';
        img.classList.toggle('is-dark', name === 'dark');
      }
      themeToggle.classList.toggle('is-dark', name === 'dark');
    }
  }

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  }

  function storeTheme(name) {
    try { localStorage.setItem(THEME_KEY, name); } catch { /* ignore */ }
  }

  function detectPreferredTheme() {
    const stored = getStoredTheme();
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  // Navigation toggle for small screens
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });

    // Close mobile nav when a link is clicked
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Theme toggle wiring
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  // Apply initial theme on load
  const initial = detectPreferredTheme();
  applyTheme(initial);

  // react to system changes if user hasn't explicitly stored a preference
  try {
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', (e) => {
        if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
      });
    }
  } catch (e) { /* ignore */ }

  // set current year in footer
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

/* Contact Form Validation */
(function contactFormInit() {
  const form = $('#contact form');
  if (!form) return;

  const name = $('#name');
  const email = $('#email');
  const message = $('#message');

  const nameErr = $('#nameError');
  const emailErr = $('#emailError');
  const msgErr = $('#messageError');

  const statusEl = $('#formStatus');

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const setError = (input, errEl, msg) => {
    errEl.textContent = msg || '';
    msg ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid');
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;

    if (!name.value.trim()) { setError(name, nameErr, 'Name is required.'); ok = false; }
    else setError(name, nameErr, '');

    const em = email.value.trim();
    if (!em) { setError(email, emailErr, 'Email is required.'); ok = false; }
    else if (!isEmail(em)) { setError(email, emailErr, 'Enter a valid email.'); ok = false; }
    else setError(email, emailErr, '');

    if (!message.value.trim()) { setError(message, msgErr, 'Message cannot be empty.'); ok = false; }
    else setError(message, msgErr, '');

    statusEl.hidden = false;
    statusEl.textContent = ok ?
      '✅ Message sent! Thanks for reaching out.' :
      'Please fix the errors above.';

    if (ok) form.reset();
  });
})();

/* Panel size sync: store About panel size and apply to Projects for exact parity */
(function panelSizeSyncInit() {
  const KEY_W = 'aboutPanel_w_v1';
  const KEY_H = 'aboutPanel_h_v1';
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 880px)').matches;
  if (!isDesktop) return; // only apply on desktop where exact parity matters

  const container = document.querySelector('main > .surface > .container');
  if (!container) return;

  try {
    if (path === 'about.html' || path === 'index.html' || path === '') {
      // capture computed size and store
      const rect = container.getBoundingClientRect();
      localStorage.setItem(KEY_W, Math.round(rect.width));
      localStorage.setItem(KEY_H, Math.round(rect.height));
    } else if (path === 'projects.html') {
      const w = localStorage.getItem(KEY_W);
      const h = localStorage.getItem(KEY_H);
      if (w && h) {
        // apply exact pixel sizes to the projects panel container
        container.style.boxSizing = 'border-box';
        container.style.width = w + 'px';
        container.style.maxWidth = w + 'px';
        container.style.minWidth = w + 'px';
        container.style.height = h + 'px';
        container.style.minHeight = h + 'px';
        container.style.margin = '0 auto';
        // ensure children can scroll horizontally inside
        const projCont = container.querySelector('.projects-container');
        if (projCont) projCont.style.alignSelf = 'stretch';
      }
    }
  } catch (e) { /* ignore storage errors */ }

  // Recompute on resize in case user resizes viewport — reapply stored dims if available
  window.addEventListener('resize', () => {
    if (!window.matchMedia('(min-width: 880px)').matches) return;
    if (window.location.pathname.split('/').pop() === 'projects.html') {
      const w = localStorage.getItem(KEY_W);
      const h = localStorage.getItem(KEY_H);
      if (w && h && container) {
        container.style.width = w + 'px';
        container.style.maxWidth = w + 'px';
        container.style.minWidth = w + 'px';
        container.style.height = h + 'px';
        container.style.minHeight = h + 'px';
      }
    }
  });

})();

/* Touch/click flip support for project cards: toggle .is-flipped on tap for touch devices */
(function cardFlipInit() {
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const cards = document.querySelectorAll('.project-item .card');
  if (!cards || cards.length === 0) return;

  // On touch devices we toggle on tap. On non-touch, hover handles flip.
  if (isTouch) {
    cards.forEach(c => {
      c.addEventListener('click', (e) => {
        // prevent accidental clicks on links inside back/front
        if (e.target.closest('a')) return;
        c.classList.toggle('is-flipped');
      });
    });

    // Close any open flipped card when tapping elsewhere
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.project-item')) {
        cards.forEach(c => c.classList.remove('is-flipped'));
      }
    });
  }
})();

/* Make project cards clickable when they include a `data-link` attribute.
   This preserves the existing DOM/CSS structure (no anchor wrappers) and
   adds keyboard accessibility (Enter/Space) while opening the repo in a
   new tab. */
(function projectCardLinkInit() {
  const items = $$('.project-item');
  if (!items || items.length === 0) return;

  items.forEach(item => {
    const url = item.getAttribute('data-link');
    const title = item.getAttribute('data-title') || 'Project';
    const card = item.querySelector('.card');
    if (!url || !card) return;

    // make it obvious it's clickable
    card.style.cursor = 'pointer';

    // screen reader label
    card.setAttribute('aria-label', `Open ${title} on GitHub`);

    // click -> open in new tab
    card.addEventListener('click', (e) => {
      // don't interfere if click originated from a real link inside
      if (e.target.closest('a')) return;
      window.open(url, '_blank', 'noopener');
    });

    // keyboard activation (Enter / Space)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.open(url, '_blank', 'noopener');
      }
    });
  });
})();

/* 4) GITHUB REPO COUNT FETCH */
(function githubStatsInit() {
  const form = $('#ghForm') || $('#githubForm');
  const input = $('#ghInput');
  const status = $('#ghStatus') || $('#ghResult');
  const result = $('#ghResult') || $('#ghStatus');
  const retry = $('#ghRetry');

  if (!form || !input || !status || !result) return;

  const loading = () => {
    status.textContent = 'Loading…';
    status.hidden = false;
    result.hidden = true;
    retry && (retry.hidden = true);
  };

  const fail = (msg) => {
    status.textContent = msg || 'Could not fetch GitHub data.';
    status.hidden = false;
    result.hidden = true;
    retry && (retry.hidden = false);
  };

  const success = (txt) => {
    result.textContent = txt;
    status.hidden = true;
    result.hidden = false;
    retry && (retry.hidden = true);
  };

  const parseUsername = raw => {
    if (!raw) return '';
    let v = raw.trim();
    v = v.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
    v = v.replace(/^@/, '');
    return v.split(/[/?#]/)[0];
  };

  const run = async () => {
    const username = parseUsername(input.value);
    if (!username) return fail('Enter a valid GitHub username or link.');

    try {
      loading();
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      if (!res.ok) throw 0;
      const data = await res.json();
      success(`${username} has ${data.public_repos} public repositories.`);
    } catch {
      fail('Unable to load data. Check your connection or username.');
    }
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    run();
  });
  retry?.addEventListener('click', run);
})();

/* Typewriter effect for headings with `.typewriter` */
(function typewriterInit() {
  const els = $$('.typewriter');
  if (!els || els.length === 0) return;

  const type = (el, text, speed = 70) => {
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        el.textContent += text.charAt(i++);
        setTimeout(tick, speed);
      } else {
        el.classList.add('typewriter-done');
      }
    };
    tick();
  };

  // Only run on first load; stagger if multiple
  els.forEach((el, idx) => {
    const text = el.getAttribute('data-text') || el.textContent || '';
    const speed = parseInt(el.getAttribute('data-speed')) || 70;
    // small delay so page feels settled
    setTimeout(() => type(el, text, speed), 120 + idx * 220);
  });
})();