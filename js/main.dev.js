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

  /* ── Navbar: hide on scroll-down, show on scroll-up ── */
  const isIOS = /(iPod|iPhone|iPad)/.test(navigator.userAgent)
             && /AppleWebKit/.test(navigator.userAgent);

  let lastScrollY = window.scrollY;
  let ticking = false;

  // Start hidden
  navbar.classList.add('is-hidden');

  function applyNavState() {
    const y = window.scrollY;
    if (Math.abs(y - lastScrollY) < 5) { ticking = false; return; }

    if (y <= 5)                                   navbar.classList.add('is-hidden');
    else if (y > lastScrollY && y > 60)           navbar.classList.add('is-hidden');
    else                                          navbar.classList.remove('is-hidden');

    lastScrollY = y;
    ticking = false;
  }

  if (isIOS) {
    /* ── iOS Safari momentum-scroll fix ──────────────────────────
       Problem: Safari freezes position:fixed repaints and stops
       firing scroll events during momentum scroll. The CSS transition
       then starts at the wrong moment → visible stutter.

       Fix: a rAF polling loop (rAF DOES fire during momentum on
       iOS 15+) that reads window.scrollY every frame. CSS transition
       is disabled during the touch/momentum phase so the navbar
       snaps instantly — no transition = no stutter. Transition is
       restored once momentum ends (~330 ms of no movement).
    ──────────────────────────────────────────────────────────── */
    let polling = false;
    let idleFrames = 0;

    function pollScroll() {
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY) >= 5) {
        if (y <= 5)                                   navbar.classList.add('is-hidden');
        else if (y > lastScrollY && y > 60)           navbar.classList.add('is-hidden');
        else                                          navbar.classList.remove('is-hidden');
        lastScrollY = y;
        idleFrames = 0;
      } else {
        idleFrames++;
      }

      if (idleFrames < 20) {                        // keep polling through momentum
        requestAnimationFrame(pollScroll);
      } else {                                       // momentum ended → restore transition
        navbar.style.transition = '';
        polling = false;
      }
    }

    window.addEventListener('touchstart', () => {
      navbar.style.transition = 'none';              // kill transition during touch
      idleFrames = 0;
      if (!polling) {
        polling = true;
        lastScrollY = window.scrollY;
        requestAnimationFrame(pollScroll);
      }
    }, { passive: true });

  } else {
    /* ── Non-iOS: standard scroll event + rAF (works fine) ── */
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(applyNavState); ticking = true; }
    }, { passive: true });
  }

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
     WAVE DIVIDERS — static paths, CSS-only animation
     ══════════════════════════════════════ */
  const VW = 1440, VH = 160, WAVE_PTS = 60;
  const BASE_Y = VH * 0.55, AMP = 28;
  const TWO_PI_FREQ = Math.PI * 2 * 0.8;

  // Build wave path once at load
  let d = '';
  for (let i = 0; i <= WAVE_PTS; i++) {
    const x = (i / WAVE_PTS) * VW;
    const y = BASE_Y + Math.sin((x / VW) * TWO_PI_FREQ) * AMP;
    d += i === 0 ? `M ${x},${y} ` : `L ${x},${y} `;
  }

  // Set paths once — CSS @keyframes handles animation from here
  document.querySelectorAll('.wave-divider').forEach(divider => {
    const wavePath = divider.querySelector('.wavePath');
    const fillPath = divider.querySelector('.fillPath');
    if (wavePath) wavePath.setAttribute('d', d);
    if (fillPath && divider.id === 'wave2') {
      fillPath.setAttribute('d', d + ` L ${VW},${VH + 20} L 0,${VH + 20} Z`);
    } else if (fillPath && divider.id !== 'wave1') {
      fillPath.setAttribute('d', d + ` L ${VW},${VH * 2} L 0,${VH * 2} Z`);
    }
  });

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

  function crossfade(blob, nextSrc, afterSrc, onDone) {
    // Load the incoming image into the inactive layer (already preloaded, instant)
    blob.inactive.src = nextSrc;

    // Simultaneously: fade inactive IN, fade active OUT
    blob.inactive.style.opacity = '1';
    blob.active.style.opacity   = '0';

    // After transition completes: swap roles (no setTimeout, no main thread blocking)
    blob.inactive.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'opacity') return;
      blob.inactive.removeEventListener('transitionend', handler);

      const prevActive   = blob.active;
      const prevInactive = blob.inactive;
      blob.active   = prevInactive;
      blob.inactive = prevActive;

      blob.inactive.src = afterSrc;
      blob.inactive.style.opacity = '0';

      if (onDone) onDone();
    });
  }

  function advance() {
    if (busy) return;
    busy = true;

    const next           = (current + 1) % images.length;
    const afterNext      = (current + 2) % images.length;
    const afterAfterNext = (current + 3) % images.length;

    // Track when both blobs finish
    let done = 0;
    function onBlobDone() {
      done++;
      if (done >= 2) busy = false;
    }

    crossfade(front, images[next],      images[afterNext],      onBlobDone);
    crossfade(back,  images[afterNext],  images[afterAfterNext], onBlobDone);

    current = next;
  }

  // Single event path for both click on stack and button
  stack.addEventListener('click', advance);
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); advance(); });
}

document.addEventListener('DOMContentLoaded', () => {
  initBlobCarousel('workshop-carousel', 'workshop-btn', WORKSHOP_IMAGES);
  initBlobCarousel('results-carousel',  'results-btn',  CHOCOLATE_IMAGES);
});
