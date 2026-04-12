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

  /* ── Lenis + GSAP — smooth scroll + navbar 1:1 tracking ──────
     Lenis takes over scroll on all devices (syncTouch: true for iOS).
     Provides consistent scroll events that bypass Safari momentum
     throttling. One unified system for desktop + mobile.
  ──────────────────────────────────────────────────────────── */
  const lenis = new Lenis({ syncTouch: true });

  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // Navbar 1:1 tracking via Lenis scroll callback
  const navH = navbar.offsetHeight;
  let navY = -navH;
  let prevScroll = window.scrollY;

  gsap.set(navbar, { y: navY, force3D: true });

  lenis.on('scroll', ({ scroll, direction }) => {
    const delta = Math.abs(scroll - prevScroll);
    prevScroll = scroll;

    if (scroll < 10) {
      navY = -navH;
    } else if (direction === 1) {
      navY = Math.max(-navH, Math.min(0, navY - delta));
    } else if (direction === -1) {
      navY = Math.max(-navH, Math.min(0, navY + delta));
    }

    gsap.set(navbar, { y: Math.round(navY), force3D: true });
  });

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

  /* ── SVG clipPath on thin wrapper (200px) instead of full sections ──
     The hero-clip-edge element sits between hero and wave1 in the DOM.
     Hero z-index:1, workshop z-index:1 → workshop cream is on top in the
     overlap zone. The clip-edge wrapper (z-index:5) shows hero dark brown
     above the wave curve and is transparent below → workshop cream visible.
     Paint area: ~200px instead of ~2000px+. ── */
  const svgNS = 'http://www.w3.org/2000/svg';
  const clipSvg = document.createElementNS(svgNS, 'svg');
  clipSvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  const clipDefs = document.createElementNS(svgNS, 'defs');

  const clipEdge = document.createElementNS(svgNS, 'clipPath');
  clipEdge.id = 'waveClipEdge';
  clipEdge.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const edgeClipPath = document.createElementNS(svgNS, 'path');
  clipEdge.appendChild(edgeClipPath);

  clipDefs.appendChild(clipEdge);
  clipSvg.appendChild(clipDefs);
  document.body.insertBefore(clipSvg, document.body.firstChild);

  // Apply clip-path to the thin wrapper only (not the full sections)
  const heroClipEdge = document.getElementById('heroClipEdge');
  if (heroClipEdge) heroClipEdge.style.clipPath = 'url(#waveClipEdge)';

  // Cached layout values — recomputed on resize only
  let wavelengthPx = WAVELENGTH;

  function buildClipPaths() {
    if (!wave1Div || !heroClipEdge) return;

    const edgeRect = heroClipEdge.getBoundingClientRect();
    const waveRect = wave1Div.getBoundingClientRect();

    const scale = waveRect.width / VW; // px per viewBox unit
    wavelengthPx = WAVELENGTH * scale;

    const waveTopInEdge = waveRect.top - edgeRect.top;
    const waveH = waveRect.height;

    // Extend 2 wavelengths beyond each edge for translateX headroom
    const extend = 2 * wavelengthPx;
    const xStart = -extend;
    const xEnd = edgeRect.width + extend;
    const totalW = xEnd - xStart;
    const numPts = Math.ceil((totalW / wavelengthPx) * 60);

    // Clip: full top of wrapper → wave bottom edge → close
    // Above wave = visible (hero dark brown), below wave = clipped (workshop cream shows)
    let d = `M ${xStart},0 H ${xEnd} `;
    for (let i = numPts; i >= 0; i--) {
      const x = xStart + (i / numPts) * totalW;
      const vbY = BASE_Y + Math.sin(((x / scale) / VW) * TWO_PI_FREQ) * AMP;
      const yPx = waveTopInEdge + (vbY / VH) * waveH;
      d += `L ${x.toFixed(1)},${yPx.toFixed(1)} `;
    }
    d += 'Z';
    edgeClipPath.setAttribute('d', d);
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

    // Thin clip-edge: translate in sync with visible waves (1 transform, not 2)
    const pxShift = -((phase % (Math.PI * 2)) / (Math.PI * 2)) * wavelengthPx;
    edgeClipPath.setAttribute('transform', `translate(${pxShift.toFixed(1)}, 0)`);

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

  // Blob elements — front has 3 clip layers, back is single
  const frontWrapEl = stack.querySelector('.gallery__front-wrap');
  const backEl  = stack.querySelector('.gallery__back-img');

  // Build a two-layer controller for one blob element
  function makeBlob(el) {
    const layerA = el.querySelector('.img-layer--a');
    const layerB = el.querySelector('.img-layer--b');
    return {
      active:   layerA,
      inactive: layerB,
    };
  }

  // Front: 3 blob-layer divs, each with its own img pair — keep all in sync
  const frontLayers = Array.from(frontWrapEl.querySelectorAll('.gallery__front-img')).map(makeBlob);
  const front = frontLayers[0]; // primary (used for seeding)
  const back  = makeBlob(backEl);

  let current = 0;
  let busy    = false;

  // Seed next images into inactive layers (immediate neighbors only)
  frontLayers.forEach(fl => { fl.inactive.src = images[(current + 1) % images.length]; });
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

  // Enforce initial opacity state on all front layers + back
  frontLayers.forEach(fl => {
    fl.active.style.opacity   = '1';
    fl.inactive.style.opacity = '0';
  });
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

    // Crossfade all front blob layers + back blob simultaneously
    frontLayers.forEach(fl => crossfade(fl, images[next], images[afterNext]));
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

  // Pause blob crossfade when off-screen (opacity animation, but still saves compositing)
  const blobObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const state = entry.isIntersecting ? 'running' : 'paused';
      entry.target.querySelectorAll('.blob-layer').forEach(layer => {
        layer.style.animationPlayState = state;
      });
    });
  }, { rootMargin: '100px' });

  const heroWrap = document.querySelector('.hero__blob-wrap');
  if (heroWrap) blobObserver.observe(heroWrap);
  document.querySelectorAll('.gallery__stack').forEach(el => blobObserver.observe(el));
});
