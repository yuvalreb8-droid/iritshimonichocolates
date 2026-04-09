/* ══════════════════════════════════════
   MAIN JS — Irit Shimoni Chocolate
   ══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Mobile Nav Toggle ── */
  const toggle = document.querySelector('.navbar__toggle');
  const navLinks = document.querySelector('.navbar__links');
  const navbar   = document.querySelector('.navbar');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navbar && navbar.classList.toggle('menu-open');
      const spans = toggle.querySelectorAll('span');
      if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
    // Close nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navbar && navbar.classList.remove('menu-open');
        const spans = toggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
    });
  }

  /* ── Navbar show/hide — 1:1 scroll tracking ─────────────────
     Navbar offset follows scroll delta pixel-for-pixel.
     Single rAF write per frame, translate3d for compositor layer.
     No layout reads in scroll/touch handlers. No rAF loop.
  ──────────────────────────────────────────────────────────── */
  const navH = navbar.offsetHeight;
  let navOffset = -navH;
  let lastScrollY = window.scrollY;
  let navTicking = false;
  let isTouching = false;

  // Initial hidden state
  navbar.style.transform = `translate3d(0, ${navOffset}px, 0)`;

  function renderNav() {
    navbar.style.transform = `translate3d(0, ${Math.round(navOffset)}px, 0)`;
    navTicking = false;
  }

  // Mobile: touchmove delta → 1:1 offset tracking
  let touchLastY = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length) {
      touchLastY = e.touches[0].clientY;
      isTouching = true;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!e.touches.length) return;
    const y = e.touches[0].clientY;
    const delta = touchLastY - y;          // positive = scrolling down
    touchLastY = y;

    if (window.scrollY < 10) {
      navOffset = -navH;
    } else {
      navOffset = Math.max(-navH, Math.min(0, navOffset - delta));
    }

    if (!navTicking) {
      navTicking = true;
      requestAnimationFrame(renderNav);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isTouching = false;
  }, { passive: true });

  /* ── Q&A Cards ── */
  function toggleCard(card) {
    const wasActive = card.classList.contains('active');
    document.querySelectorAll('.qa__card.active').forEach(c => c.classList.remove('active'));
    if (!wasActive) card.classList.add('active');
  }

  document.querySelectorAll('.qa__card').forEach(card => {
    card.addEventListener('click', () => toggleCard(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card);
      }
    });
  });

  /* ══════════════════════════════════════
     SCROLL-REACTIVE WAVE DIVIDERS
     ══════════════════════════════════════ */
  const VW = 1440, VH = 160;
  const AMP = 28;
  const FREQ = 0.8;
  const SPEED = 0.4;
  const BASE_Y = VH * 0.55;

  let currentOffset = 0, targetOffset = 0;

  const heroSection = document.getElementById('hero');
  const workshopSection = document.getElementById('workshop');
  const wave1Div = document.getElementById('wave1');
  const wave2Div = document.getElementById('wave2');

  const WAVE_PTS = 60;
  // Pre-compute x positions
  const waveXPositions = [];
  const waveXPcts = [];
  for (let i = 0; i <= WAVE_PTS; i++) {
    waveXPositions.push((i / WAVE_PTS) * VW);
    waveXPcts.push((i / WAVE_PTS) * 100);
  }
  const TWO_PI_FREQ = Math.PI * 2 * FREQ;

  function buildWave(phase) {
    let d = '';
    for (let i = 0; i <= WAVE_PTS; i++) {
      const x = waveXPositions[i];
      const y = BASE_Y + Math.sin((x / VW) * TWO_PI_FREQ + phase) * AMP;
      d += i === 0 ? `M ${x},${y} ` : `L ${x},${y} `;
    }
    return d;
  }

  function buildClipPoints(phase) {
    const points = [];
    for (let i = 0; i <= WAVE_PTS; i++) {
      const y = BASE_Y + Math.sin((waveXPositions[i] / VW) * TWO_PI_FREQ + phase) * AMP;
      points.push({ xPct: waveXPcts[i], yPct: (y / VH) * 100 });
    }
    return points;
  }

  // Cache layout measurements — update on scroll (not every frame)
  const cachedRects = { wave1: null, hero: null, workshop: null };
  function updateCachedRects() {
    if (wave1Div) cachedRects.wave1 = wave1Div.getBoundingClientRect();
    if (heroSection) cachedRects.hero = heroSection.getBoundingClientRect();
    if (workshopSection) cachedRects.workshop = workshopSection.getBoundingClientRect();
  }
  updateCachedRects();
  window.addEventListener('resize', updateCachedRects, { passive: true });

  /* ── SINGLE scroll listener — wave target + desktop navbar 1:1 ── */
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    targetOffset = y * SPEED;

    if (!isTouching) {
      const delta = y - lastScrollY;
      lastScrollY = y;

      if (y < 10) {
        navOffset = -navH;
      } else {
        navOffset = Math.max(-navH, Math.min(0, navOffset - delta));
      }

      if (!navTicking) {
        navTicking = true;
        requestAnimationFrame(renderNav);
      }
    }
  }, { passive: true });

  // Cache DOM lookups for wave dividers
  const waveDividers = Array.from(document.querySelectorAll('.wave-divider')).map(divider => ({
    divider,
    wavePath: divider.querySelector('.wavePath'),
    fillPath: divider.querySelector('.fillPath'),
  }));

  let frameSkip = 0;
  function animateWaves() {
    // Throttle to 30fps (skip every other frame) for performance
    frameSkip = (frameSkip + 1) % 2;
    if (frameSkip === 1) {
      if (wavesActive) requestAnimationFrame(animateWaves);
      else animationRunning = false;
      return;
    }

    // Read phase — layout reads before any DOM writes (no forced reflow)
    updateCachedRects();

    currentOffset += (targetOffset - currentOffset) * 0.12; // doubled lerp to compensate for 30fps
    const phase = currentOffset * 0.01;
    const wave = buildWave(phase);
    const clipPoints = buildClipPoints(phase);

    // Section dividers — stroke + fill for non-wave1 dividers
    waveDividers.forEach(({ divider, wavePath, fillPath }) => {
      if (wavePath) wavePath.setAttribute('d', wave);
      if (fillPath && divider.id === 'wave2') {
        fillPath.setAttribute('d', wave + ` L ${VW},${VH + 20} L 0,${VH + 20} Z`);
      } else if (fillPath && divider.id !== 'wave1') {
        fillPath.setAttribute('d', wave + ` L ${VW},${VH * 2} L 0,${VH * 2} Z`);
      }
    });

    // Wave1 clip-path: clip hero bottom and workshop top to the wave curve
    if (wave1Div && heroSection && workshopSection) {
      const waveRect = cachedRects.wave1;
      const heroRect = cachedRects.hero;
      const workshopRect = cachedRects.workshop;

      // Hero clip: everything visible, bottom edge follows wave curve
      // Convert wave points from wave-div-local to hero-local percentages
      let heroClip = '0% 0%, 100% 0%, '; // top-left, top-right
      // Right edge down to wave start
      for (let i = clipPoints.length - 1; i >= 0; i--) {
        const xPct = clipPoints[i].xPct;
        // Wave y in wave-div local pixels
        const waveYLocal = (clipPoints[i].yPct / 100) * waveRect.height;
        // Position relative to hero: waveRect.top - heroRect.top + waveYLocal
        const yInHero = (waveRect.top - heroRect.top) + waveYLocal;
        const yPct = (yInHero / heroRect.height) * 100;
        heroClip += `${xPct}% ${yPct}%`;
        if (i > 0) heroClip += ', ';
      }
      heroSection.style.clipPath = `polygon(${heroClip})`;

      // Workshop clip: top edge from wave1, bottom edge from wave2
      // Top edge: follows wave1 curve (left to right)
      let workshopClip = '';
      for (let i = 0; i < clipPoints.length; i++) {
        const xPct = clipPoints[i].xPct;
        const waveYLocal = (clipPoints[i].yPct / 100) * waveRect.height;
        const yInWorkshop = (waveRect.top - workshopRect.top) + waveYLocal;
        const yPct = (yInWorkshop / workshopRect.height) * 100;
        workshopClip += `${xPct}% ${yPct}%, `;
      }

      // Bottom edge: extend to full height (wave2 divider covers the transition visually)
      workshopClip += '100% 100%, 0% 100%';

      workshopSection.style.clipPath = `polygon(${workshopClip})`;
    }

    // Wave2: also clip workshop bottom independently (in case wave1 block didn't run)
    if (wave2Div && workshopSection && !wave1Div) {
      const wave2Rect = wave2Div.getBoundingClientRect();
      const wsRect = workshopSection.getBoundingClientRect();
      let wsClip = '0% 0%, 100% 0%, 100% 100%, 0% 100%';
      workshopSection.style.clipPath = `polygon(${wsClip})`;
    }

    // Only continue if any wave/section is still visible (performance: pause off-screen)
    if (wavesActive) {
      requestAnimationFrame(animateWaves);
    } else {
      animationRunning = false;
    }
  }

  // IntersectionObserver: only run wave animation when waves or relevant sections are visible
  let wavesActive = false;
  let animationRunning = false;
  const visibleElements = new Set();

  function startAnimationIfNeeded() {
    if (!animationRunning && visibleElements.size > 0) {
      wavesActive = true;
      animationRunning = true;
      requestAnimationFrame(animateWaves);
    }
    wavesActive = visibleElements.size > 0;
  }

  const waveObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleElements.add(entry.target);
      } else {
        visibleElements.delete(entry.target);
      }
    });
    startAnimationIfNeeded();
  }, { rootMargin: '100px' });

  // Observe wave dividers + hero + workshop (all elements that depend on the animation)
  document.querySelectorAll('.wave-divider').forEach(el => waveObserver.observe(el));
  if (heroSection) waveObserver.observe(heroSection);
  if (workshopSection) waveObserver.observe(workshopSection);

});

/* ══════════════════════════════════════
   BLOB CAROUSELS
   ══════════════════════════════════════ */

const WORKSHOP_IMAGES = [
  'images/people%20at%20workshop/people%20at%20workshop%201.webp',
  'images/people%20at%20workshop/people%20at%20workshop%202.webp',
  'images/people%20at%20workshop%204.webp',
  'images/Pro%20v3%20-%20Large%20Group.webp',
  'images/people%20at%20workshop/people%20at%20workshop%203.webp',
];

const CHOCOLATE_IMAGES = [
  'images/chocolate%20pictures/chocolate%20picture%201.webp',
  'images/chocolate%20pictures/chocolate%20picture%202.webp',
  'images/chocolate%20pictures/chocolate%20picture%203.webp',
  'images/chocolate%20pictures/chocolate%20picture%204.webp',
  'images/chocolate%20pictures/chocolate%20picture%205.webp',
  'images/chocolate%20pictures/chocolate%20picture%206.webp',
  'images/chocolate%20pictures/chocolate%20picture%207.webp',
  'images/chocolate%20pictures/chocolate%20picture%208.webp',
];

function preloadImages(arr) {
  arr.forEach(src => { const img = new Image(); img.src = src; });
}

/* ── Two-layer crossfade blob carousel ──────────────────────────
   Each blob (front + back) has two stacked <img> layers (a & b).
   Active layer is fully opaque; inactive is transparent & preloaded.
   On advance: set incoming src on inactive layer → crossfade both
   simultaneously by opacity → swap roles → prepare next incoming.
   No src swap on a visible layer. No blank frame. No hard cut.
   Same code path for click and any future autoplay.
───────────────────────────────────────────────────────────────── */
function initBlobCarousel(stackId, btnId, images) {
  const stack = document.getElementById(stackId);
  const btn   = document.getElementById(btnId);
  if (!stack) return;

  // Blob elements
  const frontEl = stack.querySelector('.gallery__front-img');
  const backEl  = stack.querySelector('.gallery__back-img');

  // Build a two-layer controller for one blob element
  function makeBlob(el) {
    const layerA = el.querySelector('.img-layer--a');
    const layerB = el.querySelector('.img-layer--b');
    return {
      active:   layerA,   // currently visible layer
      inactive: layerB,   // preloaded but hidden layer
    };
  }

  const front = makeBlob(frontEl);
  const back  = makeBlob(backEl);

  let current = 0;
  let busy    = false;

  // Preload the full image sets up front so subsequent transitions are instant
  preloadImages(images);

  // Seed initial images — active layers already have src from HTML
  // Preload the next images into inactive layers
  front.inactive.src = images[(current + 1) % images.length];
  back.inactive.src  = images[(current + 2) % images.length];

  // Enforce initial opacity state (CSS defaults handle this, but be explicit)
  front.active.style.opacity   = '1';
  front.inactive.style.opacity = '0';
  back.active.style.opacity    = '1';
  back.inactive.style.opacity  = '0';

  function crossfade(blob, nextSrc, afterSrc) {
    // Load the incoming image into the inactive layer (already preloaded, instant)
    blob.inactive.src = nextSrc;

    // Simultaneously: fade inactive IN, fade active OUT
    blob.inactive.style.opacity = '1';
    blob.active.style.opacity   = '0';

    // After transition: swap layer roles, seed the next incoming image
    setTimeout(() => {
      const prevActive   = blob.active;
      const prevInactive = blob.inactive;

      blob.active   = prevInactive;  // new active = was incoming
      blob.inactive = prevActive;    // new inactive = was active

      // Seed next-next image into the now-inactive layer (invisible)
      blob.inactive.src     = afterSrc;
      blob.inactive.style.opacity = '0';
    }, 700); // matches CSS transition duration (0.65s) + small buffer
  }

  function advance() {
    if (busy) return;
    busy = true;

    const next          = (current + 1) % images.length;
    const afterNext     = (current + 2) % images.length;
    const afterAfterNext = (current + 3) % images.length;

    // Crossfade both blobs simultaneously
    crossfade(front, images[next],      images[afterNext]);
    crossfade(back,  images[afterNext], images[afterAfterNext]);

    current = next;

    // Unlock after transition fully completes
    setTimeout(() => { busy = false; }, 750);
  }

  // Single event path for both click on stack and button
  stack.addEventListener('click', advance);
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); advance(); });
}

document.addEventListener('DOMContentLoaded', () => {
  initBlobCarousel('workshop-carousel', 'workshop-btn', WORKSHOP_IMAGES);
  initBlobCarousel('results-carousel',  'results-btn',  CHOCOLATE_IMAGES);
});
