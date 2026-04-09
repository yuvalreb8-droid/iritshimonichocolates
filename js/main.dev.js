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
     WAVE DIVIDERS — static 3x-wide path, scroll-driven translate3d
     ══════════════════════════════════════ */
  const WAVE_VW = 4320;   // 3x viewport (1440 * 3)
  const WAVE_VH = 160;
  const WAVE_AMP = 28;
  const WAVE_FREQ = 0.8;
  const WAVE_BASE_Y = WAVE_VH * 0.55;
  const WAVE_PTS = 180;   // 3x points for 3x width
  const WAVE_SPEED = 0.15;

  // Build wave path ONCE — 3x wide, never changes
  let strokeD = '';
  for (let i = 0; i <= WAVE_PTS; i++) {
    const x = (i / WAVE_PTS) * WAVE_VW;
    const y = WAVE_BASE_Y + Math.sin((x / 1440) * Math.PI * 2 * WAVE_FREQ) * WAVE_AMP;
    strokeD += i === 0 ? `M ${x},${y} ` : `L ${x},${y} `;
  }

  // Set static paths on all wave dividers
  const waveSvgs = [];
  document.querySelectorAll('.wave-divider').forEach(divider => {
    const wavePath = divider.querySelector('.wavePath');
    const fillPath = divider.querySelector('.fillPath');
    const svg = divider.querySelector('svg');

    if (wavePath) wavePath.setAttribute('d', strokeD);
    if (fillPath && divider.id === 'wave2') {
      fillPath.setAttribute('d', strokeD + ` L ${WAVE_VW},${WAVE_VH + 20} L 0,${WAVE_VH + 20} Z`);
    } else if (fillPath && divider.id !== 'wave1') {
      fillPath.setAttribute('d', strokeD + ` L ${WAVE_VW},${WAVE_VH * 2} L 0,${WAVE_VH * 2} Z`);
    }

    if (svg) waveSvgs.push(svg);
  });

  // Scroll-driven horizontal shift — one CSS transform per SVG, compositor only
  window.addEventListener('scroll', () => {
    const x = window.scrollY * WAVE_SPEED;
    const tx = `translate3d(${x}px, 0, 0)`;
    for (let i = 0; i < waveSvgs.length; i++) {
      waveSvgs[i].style.transform = tx;
    }
  }, { passive: true });

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
