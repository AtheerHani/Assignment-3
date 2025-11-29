
/* DOM */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* GitHub API Integration */
(function initGitHubRepos() {
  const GITHUB_USERNAME = 'AtheerHani';
  const reposContainer = $('#repos-container');
  const errorContainer = $('#repos-error');
  const loadingText = $('#repos-loading');
  const errorMessage = $('#error-message');
  const retryBtn = $('#retry-btn');

  if (!reposContainer) return;

  function displayError(message) {
    loadingText.style.display = 'none';
    reposContainer.style.display = 'none';
    errorContainer.style.display = 'block';
    errorMessage.textContent = message;
  }

  function displayRepos(repos) {
    loadingText.style.display = 'none';
    errorContainer.style.display = 'none';
    reposContainer.style.display = 'grid';
    reposContainer.innerHTML = '';

    if (repos.length === 0) {
      reposContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No public repositories found.</p>';
      return;
    }

    repos.slice(0, 6).forEach(repo => {
      const card = document.createElement('div');
      card.className = 'repo-card';
      card.innerHTML = `
        <h3 class="repo-name">${repo.name}</h3>
        <p class="repo-desc">${repo.description || 'No description available'}</p>
        <div class="repo-meta">
          ${repo.language ? `<span class="repo-language"><span class="repo-language-dot"></span>${repo.language}</span>` : ''}
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-link">View on GitHub →</a>
        </div>
      `;
      reposContainer.appendChild(card);
    });
  }

  function fetchRepos() {
    loadingText.style.display = 'block';
    errorContainer.style.display = 'none';
    reposContainer.style.display = 'none';

    fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const publicRepos = data.filter(repo => !repo.private).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        displayRepos(publicRepos);
      })
      .catch(error => {
        console.error('Error fetching repos:', error);
        displayError(`Failed to load repositories. ${error.message}. Please try again.`);
      });
  }

  fetchRepos();

  if (retryBtn) {
    retryBtn.addEventListener('click', fetchRepos);
  }
})();

/* Theme-aware logo switching for project cards */
(function initProjectLogos() {
  function updateProjectLogos() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const hujrahLogo = document.querySelector('.project-logo-flip[data-light-src]');
    
    if (hujrahLogo) {
      const lightSrc = hujrahLogo.getAttribute('data-light-src');
      const darkSrc = hujrahLogo.getAttribute('data-dark-src');
      hujrahLogo.src = isDarkMode ? darkSrc : lightSrc;
    }
  }
  
  // Update on initial load
  updateProjectLogos();
  
  // Update when theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        updateProjectLogos();
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
})();

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
      const target = link.getAttribute('target');
      if (!href) return;

      // If link has target="_blank", don't intercept - let browser handle it
      if (target === '_blank') {
        return; // allow default behavior
      }

      // If this is an in-page hash link, animate the indicator and smoothly
      // scroll to the section instead of navigating away. Update history
      // so the hash reflects the target.
      if (href.startsWith('#')) {
        e.preventDefault();
        placeIndicator(link, true);
        const targetEl = document.querySelector(href);
        // small delay so the underline moves first, then scroll
        setTimeout(() => {
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          try { history.pushState(null, '', href); } catch (err) { location.hash = href; }
        }, 120);
        active = link;
        return;
      }

      // External or cross-page navigation: keep previous behavior
      e.preventDefault();
      placeIndicator(link, true);
      setTimeout(() => { window.location.href = href; }, 280);
    });
  });

  // Move the underline on hover and keep it where it was last hovered.
  // Do not auto-restore to the page-active link on mouseleave — keep the
  // underline positioned at the most recently hovered nav item until the
  // user hovers another link or clicks one.
  let lastHovered = null;
  links.forEach(l => {
    l.addEventListener('mouseenter', () => {
      placeIndicator(l, true);
      lastHovered = l;
    });
    // intentionally no mouseleave handler — leave underline where last hovered
  });

  // reposition on resize (no animation)
  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => placeIndicator(lastHovered || active, false), 120);
  });

  // if user navigates via history buttons, update active
  window.addEventListener('popstate', () => {
    const newPage = (location.pathname.split('/').pop() || 'index.html');
    active = links.find(a => a.getAttribute('href') === newPage) || links[0];
    placeIndicator(active, false);
  });

})();

/* Background decorations: blobs, SVG shapes, and small particles */
// Recreate background for About page: remove any previous background elements
// and inject a single clean instance. This function is idempotent for the
// current page.
(function backgroundDecorInit() {
  try {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Only operate on the About page to match the user's request
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (!['about.html', 'index.html', ''].includes(page)) return;

    // Remove any previously injected background elements to ensure a single
    // background instance (prevents layering/seams).
    document.querySelectorAll('.bg-decor, #particles-js, .bg-dots').forEach(el => el.remove());

    // Create container
    const decor = document.createElement('div');
    decor.className = 'bg-decor';
    document.body.appendChild(decor);

    // Blob colors from CSS variables (darken slightly so blobs aren't too bright)
    const _rawBlobColors = [
      getComputedStyle(document.documentElement).getPropertyValue('--accent-color') || '#254B8A',
      getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#12355A',
      getComputedStyle(document.documentElement).getPropertyValue('--success-color') || '#1E5FA8',
      getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#0B2138'
    ];

    // utility: darken hex or rgb(a) color strings by a fractional amount (0..1)
    function darkenColor(col, amount = 0.6) {
      if (!col) return col;
      col = col.trim();
      // rgb/rgba
      const rgbMatch = col.match(/rgba?\(([^)]+)\)/);
      if (rgbMatch) {
        const parts = rgbMatch[1].split(',').map(p => p.trim());
        let r = Math.round(parseFloat(parts[0]) * (1 - amount));
        let g = Math.round(parseFloat(parts[1]) * (1 - amount));
        let b = Math.round(parseFloat(parts[2]) * (1 - amount));
        return `rgb(${r}, ${g}, ${b})`;
      }
      // hex #rrggbb
      const hexMatch = col.match(/^#([0-9a-f]{6})/i);
      if (hexMatch) {
        const hex = hexMatch[1];
        const r = parseInt(hex.slice(0,2),16);
        const g = parseInt(hex.slice(2,4),16);
        const b = parseInt(hex.slice(4,6),16);
        const nr = Math.max(0, Math.min(255, Math.round(r * (1 - amount))));
        const ng = Math.max(0, Math.min(255, Math.round(g * (1 - amount))));
        const nb = Math.max(0, Math.min(255, Math.round(b * (1 - amount))));
        return `rgb(${nr}, ${ng}, ${nb})`;
      }
      // fallback: return original
      return col;
    }

    // Use explicit navy-leaning colors for the blobs so they read as deep
    // navy tones (not greys) on the dark background. These are darker
    // hex values chosen to match the site's palette while avoiding light
    // or purple tints.
    const blobColors = [
      '#0A2A47', // deep navy (variant of secondary)
      '#071427', // midnight navy (very dark)
      '#042037', // teal-navy mix for depth
      '#061A2B'  // dark slate navy (near-primary)
    ];

    // Decorative blobs removed per user request: do not inject blob DOM elements.
    // Intentionally skip creation of `.blob` elements so the background is clean.

    // SVG shapes removed — keep background blobs and particles only.
    // (The rotating central SVG shapes were removed per user request.)

    // Particles/dot field removed: no DOM injection for particles or animated dots.
    // This block intentionally left empty to keep backgroundDecorInit focused on blobs only.

    // Ensure no section-level glass is applied so background remains continuous
    document.querySelectorAll('section, section > .container, main > .surface > .container').forEach(el => el.classList.remove('glass-applied'));

    // Apply glass only to small UI elements (do NOT apply to whole project-item wrappers)
    document.querySelectorAll('.stats-card').forEach(el => el.classList.add('glass-applied'));

    // mark initialized to avoid duplicate runs
    try { document.documentElement.dataset.bgInitialized = '1'; } catch (e) { /* ignore */ }
  } catch (e) {
    console.error('backgroundDecorInit error', e);
  }
})();

/* Starfield (3D particles) — generate at runtime from JS so we can use
   randomized box-shadow similar to the provided CodePen SCSS. This keeps
   the site's gradient background intact and avoids setting `overflow:hidden`.
   Parameters mirror the CodePen: stars, depth, speed, width, height. */
// Replace previous starfield with an implementation that mirrors the
// provided CodePen SCSS/HTML exactly (stars, depth, speed, width, height)
// The implementation builds the large box-shadow list in JS and injects
// CSS that uses the original keyframe names `fly`, `fade1`, and `fade2`.
// Remove any injected starfield/styles and keep the site's gradient + scrolling.
(function codepenStarfield() {
  try {
    // remove any previously injected style blocks and DOM nodes from earlier runs
    document.querySelectorAll('style[data-generated-by^="codepen-starfield"]').forEach(s => s.remove());
    document.querySelectorAll('.stars, .stars-wrap').forEach(el => el.remove());
    // intentionally do not inject any starfield so the background stays the gradient
    return;
  } catch (err) {
    console.error('codepenStarfield cleanup error', err);
  }
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
    // Swap project logos when a theme change occurs if light/dark variants are provided.
    try {
      document.querySelectorAll('.project-logo[data-light-src]').forEach(imgEl => {
        const lightSrc = imgEl.getAttribute('data-light-src');
        const darkSrc = imgEl.getAttribute('data-dark-src') || imgEl.getAttribute('data-dark') || imgEl.getAttribute('src');
        if (name === 'light' && lightSrc) imgEl.src = lightSrc;
        else if (darkSrc) imgEl.src = darkSrc;
      });
    } catch (e) { /* ignore if DOM not ready */ }
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
    // Default to dark mode when the user has not previously selected a preference.
    // This makes the site load in dark mode by default; pressing the theme
    // button will switch to light and store the preference.
    return 'dark';
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

/* Contact Form Validation with Popup Notifications */
(function contactFormInit() {
  const form = $('#contact form');
  if (!form) return;

  const name = $('#name');
  const email = $('#email');
  const message = $('#message');

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Initialize EmailJS (you'll need to get your own service ID and template ID)
  // For now, we'll use a fallback mailto method
  const RECIPIENT_EMAIL = 'Atheer.almomtin@gmail.com';

  const showPopup = (msg) => {
    // Remove existing popup if any
    const existing = form.querySelector('.form-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'form-popup';
    popup.textContent = msg;
    form.parentElement.insertBefore(popup, form);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 200);
    }, 3000);
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    let errorMsg = '';

    // Check if any field is empty
    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      errorMsg = 'Please fill the required fields';
      ok = false;
    }
    // Check email validity if fields are filled
    else if (!isEmail(email.value.trim())) {
      errorMsg = 'Please enter a valid Email';
      ok = false;
    }

    if (!ok) {
      showPopup(errorMsg);
      return;
    }

    // Form is valid - send email via FormSubmit.co
    const formData = new FormData();
    formData.append('name', name.value.trim());
    formData.append('email', email.value.trim());
    formData.append('message', message.value.trim());

    fetch('https://formsubmit.co/6ee1d5fa41565281c0e21a53921c2d00', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      // Show success modal regardless of response
      const modal = document.getElementById('successModal');
      if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        modal.classList.add('active');
        modalContent.classList.remove('dismiss');
        form.reset();
        // Auto-dismiss after 1.5 seconds
        setTimeout(() => {
          modalContent.classList.add('dismiss');
          setTimeout(() => {
            modal.classList.remove('active');
          }, 400);
        }, 1500);
      } else {
        showPopup('✅ Message sent! Thanks for reaching out.');
        form.reset();
      }
    })
    .catch(error => {
      console.error('Error sending email:', error);
      showPopup('Failed to send message. Please try again.');
    });
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
    } else if (path === 'projects.html' || ((path === 'index.html' || path === '') && window.location.hash && window.location.hash.indexOf('projects') !== -1)) {
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
    const pop = window.location.pathname.split('/').pop();
    const isProjectsRoute = pop === 'projects.html' || ((pop === 'index.html' || pop === '') && window.location.hash && window.location.hash.indexOf('projects') !== -1);
    if (isProjectsRoute) {
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


(function scrollRevealInit() {
  try {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Abstract wave canvas overlay: injects #canv and draws an animated wave on top of
   the existing animated gradient background. Uses CSS `--accent-color` and adapts
   alpha for light/dark themes. Non-interactive and preserves page scrolling. */
(function abstractWaveCanvas(){
  if (typeof window === 'undefined') return;

  // Avoid creating multiple canvases if script re-runs
  if (document.getElementById('canv')) return;

  var canv = document.createElement('canvas');
  canv.id = 'canv';
  canv.className = 'canvas';
  canv.setAttribute('data-bgcolor', 'transparent');
  document.body.appendChild(canv);

  var ctx = canv.getContext('2d');

  function getCSSAccentColor(alpha){
    var cs = getComputedStyle(document.documentElement);
    // Prefer a lighter gradient stop when the page is in light mode
    var isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    var hex = (isLightTheme
      ? (cs.getPropertyValue('--gradient-3') || cs.getPropertyValue('--accent-color'))
      : (cs.getPropertyValue('--accent-color') || cs.getPropertyValue('--gradient-3')) || '#1F3A6B'
    ).trim();
    // Normalize hex and convert to rgba
    function hexToRgba(h, a){
      h = h.replace('#','');
      if (h.length === 3) h = h.split('').map(function(x){ return x + x; }).join('');
      var r = parseInt(h.substr(0,2),16);
      var g = parseInt(h.substr(2,2),16);
      var b = parseInt(h.substr(4,2),16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + (a == null ? 1 : a) + ')';
    }
    return hexToRgba(hex, alpha);
  }

  // Responsive pixel scaling
  var cssWidth = window.innerWidth;
  var cssHeight = window.innerHeight;
  var dpr = window.devicePixelRatio || 1;

  function resize(){
    cssWidth = window.innerWidth;
    cssHeight = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canv.style.width = cssWidth + 'px';
    canv.style.height = cssHeight + 'px';
    canv.width = Math.max(1, Math.floor(cssWidth * dpr));
    canv.height = Math.max(1, Math.floor(cssHeight * dpr));
    // Reset transform so drawing coordinates match CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Initial resize
  resize();
  window.addEventListener('resize', resize, { passive: true });

  var t = 0;

  function draw(){
    // Clear with transparent so page background shows through
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    // Slightly higher contrast in light mode — increase alpha so wave shows up better
    var alphaBase = isLight ? 0.26 : 0.08;
    // Slightly thicker strokes in light mode to improve visibility
    var baseLineWidth = isLight ? 1.2 : 0.8;

    for (var i = -60; i < 60; i += 1) {
      var alpha = alphaBase * (1 - Math.abs(i) / 120); // central lines slightly stronger
      ctx.strokeStyle = getCSSAccentColor(alpha);
      ctx.lineWidth = baseLineWidth;
      ctx.beginPath();
      ctx.moveTo(0, cssHeight / 2);
      for (var j = 0; j < cssWidth; j += 10) {
        var x = 10 * Math.sin(i / 10) + j + 0.008 * j * j;
        var y = Math.floor(cssHeight / 2 + j / 2 * Math.sin(j / 50 - t / 50 - i / 118) + (i * 0.9) * Math.sin(j / 25 - (i + t) / 65));
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function loop(){
    t += 1;
    draw();
    requestAnimationFrame(loop);
  }

  // Start animation. Canvas is non-blocking and preserves page scroll.
  requestAnimationFrame(loop);
})();

    // selectors to target for reveal. Add/remove selectors as needed.
    const selectors = [
      'section', '.hero-inner', '.about-text', '.about-aside', '.dev-card', '.conf-card', '.vol-card', '.skill-card', '.project-item', '.projects-grid', '.profile-pic', '.typewriter', '.btn'
    ];

    // gather unique elements
    const elems = Array.from(new Set(selectors.flatMap(s => Array.from(document.querySelectorAll(s)))));
    if (!elems.length) return;

    // If user prefers reduced motion, just make elements visible immediately
    if (prefersReduced) {
      elems.forEach(el => el.classList.add('reveal-visible'));
      return;
    }

    // add starting class so CSS hides them until revealed
    elems.forEach(el => el.classList.add('reveal'));

    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    elems.forEach(el => obs.observe(el));
  } catch (e) {
    // fail silently
    console.error('scrollRevealInit error', e);
  }
})();

/* Skills Filter: toggle visibility based on category selection */
(function initSkillsFilter() {
  const filterBtns = $$('.filter-btn');
  const skillCards = $$('.skill-card');
  const FILTER_KEY = 'skillsFilterSelection';

  if (!filterBtns || filterBtns.length === 0 || !skillCards || skillCards.length === 0) return;

  // Load saved filter preference
  let savedFilter = 'all';
  try {
    savedFilter = localStorage.getItem(FILTER_KEY) || 'all';
  } catch (e) { /* ignore */ }

  // Apply filter
  const applyFilter = (category) => {
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === category);
    });

    skillCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      const matches = category === 'all' || cardCategory === category;
      
      if (matches) {
        card.classList.remove('hidden');
        // Trigger animation by removing and re-adding
        card.style.animation = 'none';
        void card.offsetHeight; // force reflow
        card.style.animation = '';
      } else {
        card.classList.add('hidden');
      }
    });

    // Save filter preference
    try {
      localStorage.setItem(FILTER_KEY, category);
    } catch (e) { /* ignore */ }
  };

  // Set up button listeners
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter');
      applyFilter(category);
    });
  });

  // Apply saved filter on load
  applyFilter(savedFilter);
})();

/* ========== INTERACTIVE RUBIK'S CUBE FOR PORTFOLIO ========== */
(function initPortfolioRubiksCube() {
  if (typeof THREE === 'undefined') return;

  const cubeContainer = document.querySelector('.cube-container');
  if (!cubeContainer) return;

  const gameDiv = cubeContainer.querySelector('.ui__game');
  if (!gameDiv) return;

  let scene, camera, renderer, rubiksCube;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotationVelocity = { x: 0, y: 0 };

  // Rubik's cube colors - highly contrasting blue shades
  // Light mode: light to dark blues, Dark mode: bright to deep blues
  const isDarkMode = () => document.documentElement.getAttribute('data-theme') === 'dark';
  
  const COLORS = isDarkMode() ? {
    // Dark mode: maximum contrast blues
    brightBlue: 0x40A8C6,   // bright cyan-blue
    lightBlue: 0x6BB8D6,    // light blue (much lighter)
    mediumBlue: 0x2E6BA8,   // medium blue
    accentBlue: 0x1F3A6B,   // darker accent
    darkBlue: 0x0F1F3F,     // very dark blue
    navyBlue: 0x041020      // almost black navy
  } : {
    // Light mode: bright to deep blues with maximum separation
    brightBlue: 0x5DADE2,   // bright light blue
    lightBlue: 0x3498DB,    // light blue
    mediumBlue: 0x2471A3,   // medium blue
    accentBlue: 0x154360,   // dark blue
    darkBlue: 0x082741,     // very dark blue
    navyBlue: 0x051133      // navy black
  };

  function init() {
    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(60, gameDiv.clientWidth / gameDiv.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(gameDiv.clientWidth, gameDiv.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    gameDiv.appendChild(renderer.domElement);

    // Professional lighting setup (CodePen style)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(8, 8, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.35);
    backLight.position.set(-8, -6, -8);
    scene.add(backLight);

    // Create Rubik's cube
    rubiksCube = createRubiksCube();
    // Set initial rotation to show the blue, red, and white corner
    rubiksCube.rotation.order = 'YXZ';
    rubiksCube.rotation.x = 0.55;
    rubiksCube.rotation.y = -0.6;
    rotationX = 0.55;
    rotationY = -0.6;
    scene.add(rubiksCube);

    window.addEventListener('resize', onWindowResize, false);
    gameDiv.addEventListener('mousedown', onMouseDown, false);
    gameDiv.addEventListener('mousemove', onMouseMove, false);
    gameDiv.addEventListener('mouseup', onMouseUp, false);
    gameDiv.addEventListener('touchstart', onTouchStart, false);
    gameDiv.addEventListener('touchmove', onTouchMove, false);
    gameDiv.addEventListener('touchend', onTouchEnd, false);
    gameDiv.addEventListener('mouseleave', onMouseUp, false);

    animate();
  }

  function createRubiksCube() {
    const cubeGroup = new THREE.Group();
    const PIECE_SIZE = 0.75;
    const GAP = 0.09;
    const UNIT = PIECE_SIZE + GAP;

    // Create all 27 pieces
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const piece = createCubePiece(PIECE_SIZE, x, y, z);
          piece.position.set(x * UNIT, y * UNIT, z * UNIT);
          cubeGroup.add(piece);
        }
      }
    }

    return cubeGroup;
  }

  function createCubePiece(size, posX, posY, posZ) {
    const group = new THREE.Group();
    
    // Create simple box geometry for clean colors
    const geometry = new THREE.BoxGeometry(size, size, size, 2, 2, 2);
    
    // Create materials for each face
    const materials = [];
    
    const getMaterial = (color) => {
      return new THREE.MeshPhongMaterial({
        color: color,
        shininess: 120,
        flatShading: false,
        side: THREE.FrontSide
      });
    };
    
    // Right face (X+)
    materials.push(getMaterial(posX > 0 ? COLORS.brightBlue : 0x0f0f0f));
    
    // Left face (X-)
    materials.push(getMaterial(posX < 0 ? COLORS.lightBlue : 0x0f0f0f));
    
    // Top face (Y+)
    materials.push(getMaterial(posY > 0 ? COLORS.mediumBlue : 0x0f0f0f));
    
    // Bottom face (Y-)
    materials.push(getMaterial(posY < 0 ? COLORS.accentBlue : 0x0f0f0f));
    
    // Front face (Z+)
    materials.push(getMaterial(posZ > 0 ? COLORS.darkBlue : 0x0f0f0f));
    
    // Back face (Z-)
    materials.push(getMaterial(posZ < 0 ? COLORS.navyBlue : 0x0f0f0f));

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Apply slight rounding through scale and smooth shading
    mesh.geometry.computeVertexNormals();
    
    group.add(mesh);

    // Add bold black edges for clear definition
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ 
        color: 0x000000,
        fog: false
      })
    );
    // Scale up slightly for thicker appearance
    line.position.z += 0.0001;
    group.add(line);

    return group;
  }

  function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    rotationVelocity = { x: 0, y: 0 };
  }

  function onMouseMove(event) {
    if (isDragging) {
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;

      rotationVelocity.y = deltaX * 0.01;
      rotationVelocity.x = deltaY * 0.01;

      rubiksCube.rotation.order = 'YXZ';
      rubiksCube.rotation.y += rotationVelocity.y;
      rubiksCube.rotation.x += rotationVelocity.x;

      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  function onMouseUp() {
    isDragging = false;
  }

  function onTouchStart(event) {
    if (event.touches.length === 1) {
      isDragging = true;
      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      rotationVelocity = { x: 0, y: 0 };
    }
  }

  function onTouchMove(event) {
    if (isDragging && event.touches.length === 1) {
      const deltaX = event.touches[0].clientX - previousMousePosition.x;
      const deltaY = event.touches[0].clientY - previousMousePosition.y;

      rotationVelocity.y = deltaX * 0.01;
      rotationVelocity.x = deltaY * 0.01;

      rubiksCube.rotation.order = 'YXZ';
      rubiksCube.rotation.y += rotationVelocity.y;
      rubiksCube.rotation.x += rotationVelocity.x;

      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
  }

  function onTouchEnd() {
    isDragging = false;
  }

  function onWindowResize() {
    const width = gameDiv.clientWidth;
    const height = gameDiv.clientHeight;

    if (width > 0 && height > 0) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
      rotationVelocity.x *= 0.98;
      rotationVelocity.y *= 0.98;
      
  
      rotationVelocity.y += 0.0001;
      
      rubiksCube.rotation.order = 'YXZ';
      rubiksCube.rotation.y += rotationVelocity.y;
      rubiksCube.rotation.x += rotationVelocity.x;
    }

    renderer.render(scene, camera);
  }

  init();
})();

/* ========== EXPERIENCE CAROUSEL ========== */
(function initExperienceCarousel() {
  const carousel = document.querySelector('.experience-carousel');
  const prevBtn = document.querySelector('.carousel-nav-prev');
  const nextBtn = document.querySelector('.carousel-nav-next');
  
  if (!carousel || !prevBtn || !nextBtn) return;

  const cardWidth = 360;
  const cardGap = 20;
  const itemSize = cardWidth + cardGap;
  let isTransitioning = false;
  
  // Get original cards
  const originalCards = Array.from(carousel.querySelectorAll('.experience-card'));
  const originalCardCount = originalCards.length;

  // Set up carousel
  carousel.style.display = 'flex';
  carousel.style.flexDirection = 'row';

  // Clone: first card to end, last card to start
  const firstCardClone = originalCards[0].cloneNode(true);
  const lastCardClone = originalCards[originalCardCount - 1].cloneNode(true);
  
  carousel.insertBefore(lastCardClone, carousel.firstChild);
  carousel.appendChild(firstCardClone);

  // Now get all cards (includes clones)
  let allCards = Array.from(carousel.querySelectorAll('.experience-card'));
  const totalCards = allCards.length; // 9 + 2 = 11
  
  // Start at index 1 (first real card)
  let currentIndex = 1;

  // Initialize card display
  const initializeCards = () => {
    allCards.forEach((card) => {
      card.style.minHeight = '520px';
      card.style.height = '520px';
      card.style.width = cardWidth + 'px';
      card.style.flex = `0 0 ${cardWidth}px`;
      card.style.transition = 'opacity 500ms ease, filter 500ms ease, transform 500ms ease';
    });
  };

  // Update carousel position
  const updateCarousel = (smooth = true) => {
    if (smooth && isTransitioning) return;
    
    if (smooth) {
      isTransitioning = true;
      carousel.style.transition = 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
      carousel.style.transition = 'none';
    }

    // Calculate offset: simple approach
    const offset = -(currentIndex - 1) * itemSize;
    carousel.style.transform = `translateX(${offset}px)`;

    // Determine which real card indices are visible
    let centerIdx = currentIndex;
    let leftIdx = currentIndex - 1;
    let rightIdx = currentIndex + 1;

    // Update card styling
    allCards.forEach((card, index) => {
      if (index === centerIdx) {
        card.style.opacity = '1';
        card.style.filter = 'blur(0px)';
        card.style.transform = 'scale(1)';
        card.style.pointerEvents = 'auto';
      } else if (index === leftIdx || index === rightIdx) {
        card.style.opacity = '0.65';
        card.style.filter = 'blur(0px)';
        card.style.transform = 'scale(0.9)';
        card.style.pointerEvents = 'auto';
      } else {
        card.style.opacity = '0';
        card.style.filter = 'blur(3px)';
        card.style.transform = 'scale(0.8)';
        card.style.pointerEvents = 'none';
      }
    });

    if (smooth) {
      setTimeout(() => {
        // After animation, check if we're at a clone and jump seamlessly
        if (currentIndex === 0) {
          // At fake first (last card clone), jump to real last
          currentIndex = originalCardCount;
          carousel.style.transition = 'none';
          const newOffset = -(currentIndex - 1) * itemSize;
          carousel.style.transform = `translateX(${newOffset}px)`;
          
          // Re-apply styling for new position
          let centerIdx = currentIndex;
          let leftIdx = currentIndex - 1;
          let rightIdx = currentIndex + 1;
          allCards.forEach((card, index) => {
            if (index === centerIdx) {
              card.style.opacity = '1';
              card.style.filter = 'blur(0px)';
              card.style.transform = 'scale(1)';
            } else if (index === leftIdx || index === rightIdx) {
              card.style.opacity = '0.65';
              card.style.filter = 'blur(0px)';
              card.style.transform = 'scale(0.9)';
            } else {
              card.style.opacity = '0';
              card.style.filter = 'blur(3px)';
              card.style.transform = 'scale(0.8)';
            }
          });
        } else if (currentIndex === totalCards - 1) {
          // At fake last (first card clone), jump to real first
          currentIndex = 1;
          carousel.style.transition = 'none';
          const newOffset = -(currentIndex - 1) * itemSize;
          carousel.style.transform = `translateX(${newOffset}px)`;
          
          // Re-apply styling for new position
          let centerIdx = currentIndex;
          let leftIdx = currentIndex - 1;
          let rightIdx = currentIndex + 1;
          allCards.forEach((card, index) => {
            if (index === centerIdx) {
              card.style.opacity = '1';
              card.style.filter = 'blur(0px)';
              card.style.transform = 'scale(1)';
            } else if (index === leftIdx || index === rightIdx) {
              card.style.opacity = '0.65';
              card.style.filter = 'blur(0px)';
              card.style.transform = 'scale(0.9)';
            } else {
              card.style.opacity = '0';
              card.style.filter = 'blur(3px)';
              card.style.transform = 'scale(0.8)';
            }
          });
        }
        
        isTransitioning = false;
      }, 600);
    }
  };

  // Navigation handlers
  prevBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    currentIndex--;
    updateCarousel(true);
  });

  nextBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    currentIndex++;
    updateCarousel(true);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const isCarouselInView = carousel.closest('#experience');
    if (!isCarouselInView || isTransitioning) return;
    
    if (e.key === 'ArrowLeft') {
      currentIndex--;
      updateCarousel(true);
    } else if (e.key === 'ArrowRight') {
      currentIndex++;
      updateCarousel(true);
    }
  });

  // Initial setup
  initializeCards();
  updateCarousel(false);
})();

