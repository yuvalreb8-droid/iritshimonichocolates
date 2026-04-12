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

  /* ── Navbar show/hide — native scroll, no Lenis ──────────────
     Pure native scroll listener + CSS transition for the navbar.
     No RAF loop, no scroll hijacking. iOS handles momentum natively.
  ──────────────────────────────────────────────────────────── */
  const navH = navbar.offsetHeight + 20;
  let prevScroll = window.scrollY;
  let navVisible = false;

  // Start hidden
  navbar.style.transform = `translateY(-${navH}px)`;
  navbar.style.transition = 'transform 0.35s ease-out';

  window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    const direction = scroll - prevScroll;
    prevScroll = scroll;

    if (scroll < 10) {
      // Near top — hide with slower transition
      navbar.style.transition = 'transform 0.8s ease-out';
      navbar.style.transform = `translateY(-${navH}px)`;
      navVisible = false;
    } else if (direction > 3 && navVisible) {
      // Scrolling down — hide
      navbar.style.transition = 'transform 0.35s ease-out';
      navbar.style.transform = `translateY(-${navH}px)`;
      navVisible = false;
    } else if (direction < -3 && !navVisible) {
      // Scrolling up — show
      navbar.style.transition = 'transform 0.35s ease-out';
      navbar.style.transform = 'translateY(0)';
      navVisible = true;
    }
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
     All waves use pre-rendered wide SVGs + GPU translateX.
     Hero/workshop content clipping uses SVG <clipPath> + translateX.
     Per-frame work: lerp offset → 1 transform per SVG + 1 per clipPath.
     ══════════════════════════════════════ */
  const VW = 1440, VH = 160;
  const AMP = 28;
  const FREQ = 0.8;
  const SPEED = 0.4;
  const BASE_Y = VH * 0.55;
  const TWO_PI_FREQ = Math.PI * 2 * FREQ;
  const WAVELENGTH = VW / FREQ; // 1800 viewBox units

  let currentOffset = 0, targetOffset = 0;

  const heroSection = document.getElementById('hero');
  const workshopSection = document.getElementById('workshop');
  const wave1Div = document.getElementById('wave1');

  // All wave divider SVGs (wave1, wave2, wave3) — GPU translateX on scroll
  const cssWaveSvgs = Array.from(document.querySelectorAll('.wave-divider--css svg'));

  /* ── SVG clipPath: clip hero bottom + workshop top to wave curve ── */
  const svgNS = 'http://www.w3.org/2000/svg';
  const clipSvg = document.createElementNS(svgNS, 'svg');
  clipSvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  const clipDefs = document.createElementNS(svgNS, 'defs');

  const clipHero = document.createElementNS(svgNS, 'clipPath');
  clipHero.id = 'waveClipHero';
  clipHero.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const heroClipPath = document.createElementNS(svgNS, 'path');
  clipHero.appendChild(heroClipPath);

  const clipWs = document.createElementNS(svgNS, 'clipPath');
  clipWs.id = 'waveClipWorkshop';
  clipWs.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const wsClipPath = document.createElementNS(svgNS, 'path');
  clipWs.appendChild(wsClipPath);

  clipDefs.appendChild(clipHero);
  clipDefs.appendChild(clipWs);
  clipSvg.appendChild(clipDefs);
  document.body.insertBefore(clipSvg, document.body.firstChild);

  // Apply clip-path CSS references (static — never changes after this)
  if (heroSection) heroSection.style.clipPath = 'url(#waveClipHero)';
  if (workshopSection) workshopSection.style.clipPath = 'url(#waveClipWorkshop)';

  // Cached layout values — recomputed on resize only
  let wavelengthPx = WAVELENGTH;

  function buildClipPaths() {
    if (!wave1Div || !heroSection || !workshopSection) return;

    const heroRect = heroSection.getBoundingClientRect();
    const waveRect = wave1Div.getBoundingClientRect();
    const wsRect = workshopSection.getBoundingClientRect();

    const scale = waveRect.width / VW; // px per viewBox unit
    wavelengthPx = WAVELENGTH * scale;

    const waveTopInHero = waveRect.top - heroRect.top;
    const waveTopInWs = waveRect.top - wsRect.top;
    const waveH = waveRect.height;

    // Extend 2 wavelengths beyond each edge for translateX headroom
    const extend = 2 * wavelengthPx;
    const xStart = -extend;
    const xEnd = heroRect.width + extend;
    const totalW = xEnd - xStart;
    const numPts = Math.ceil((totalW / wavelengthPx) * 60);

    // Hero clip: full top → wave bottom edge → close
    let hd = `M ${xStart},0 H ${xEnd} `;
    for (let i = numPts; i >= 0; i--) {
      const x = xStart + (i / numPts) * totalW;
      const vbY = BASE_Y + Math.sin(((x / scale) / VW) * TWO_PI_FREQ) * AMP;
      const yPx = waveTopInHero + (vbY / VH) * waveH;
      hd += `L ${x.toFixed(1)},${yPx.toFixed(1)} `;
    }
    hd += 'Z';
    heroClipPath.setAttribute('d', hd);

    // Workshop clip: wave top edge → full bottom → close
    let wd = '';
    for (let i = 0; i <= numPts; i++) {
      const x = xStart + (i / numPts) * totalW;
      const vbY = BASE_Y + Math.sin(((x / scale) / VW) * TWO_PI_FREQ) * AMP;
      const yPx = waveTopInWs + (vbY / VH) * waveH;
      wd += (i === 0 ? 'M ' : 'L ') + `${x.toFixed(1)},${yPx.toFixed(1)} `;
    }
    wd += `L ${xEnd},${wsRect.height} L ${xStart},${wsRect.height} Z`;
    wsClipPath.setAttribute('d', wd);
  }

  buildClipPaths();
  window.addEventListener('resize', buildClipPaths, { passive: true });

  /* ── Scroll listener ── */
  window.addEventListener('scroll', () => {
    targetOffset = window.scrollY * SPEED;
  }, { passive: true });

  let frameSkip = 0;
  function animateWaves() {
    // Throttle to 30fps
    frameSkip = (frameSkip + 1) % 2;
    if (frameSkip === 1) {
      if (wavesActive) requestAnimationFrame(animateWaves);
      else animationRunning = false;
      return;
    }

    currentOffset += (targetOffset - currentOffset) * 0.12;
    const phase = currentOffset * 0.01;

    // All wave SVGs: scroll-reactive GPU translate
    const shiftPct = ((phase / (Math.PI * 2)) * 50) % 50;
    for (let i = 0; i < cssWaveSvgs.length; i++) {
      cssWaveSvgs[i].style.transform = `translate3d(-${shiftPct}%, 0, 0)`;
    }

    // Hero/workshop clip paths: translate in sync with visible waves
    const pxShift = -((phase % (Math.PI * 2)) / (Math.PI * 2)) * wavelengthPx;
    const t = `translate(${pxShift.toFixed(1)}, 0)`;
    heroClipPath.setAttribute('transform', t);
    wsClipPath.setAttribute('transform', t);

    if (wavesActive) {
      requestAnimationFrame(animateWaves);
    } else {
      animationRunning = false;
    }
  }

  // IntersectionObserver: pause rAF when wave area off-screen
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
      if (entry.isIntersecting) visibleElements.add(entry.target);
      else visibleElements.delete(entry.target);
    });
    startAnimationIfNeeded();
  }, { rootMargin: '100px' });

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

  // Seed next images into inactive layers (immediate neighbors only)
  front.inactive.src = images[(current + 1) % images.length];
  back.inactive.src  = images[(current + 2) % images.length];

  // Lazy-preload remaining images when carousel scrolls near viewport
  let preloaded = false;
  const preloadObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !preloaded) {
      preloaded = true;
      preloadImages(images);
      preloadObserver.disconnect();
    }
  }, { rootMargin: '300px' });
  preloadObserver.observe(stack);

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

  // Pause blobMorph animation when off-screen to eliminate idle repaints
  const blobObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // For gallery stacks, target the animated front-img child
      const el = entry.target;
      const animated = el.classList.contains('hero__blob-circle')
        ? el
        : el.querySelector('.gallery__front-img');
      if (animated) {
        animated.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      }
    });
  }, { rootMargin: '100px' });

  const heroBlob = document.querySelector('.hero__blob-circle');
  if (heroBlob) blobObserver.observe(heroBlob);
  document.querySelectorAll('.gallery__stack').forEach(el => blobObserver.observe(el));
});
