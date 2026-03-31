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

  /* ── Navbar show/hide on scroll ── */
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    navbar.classList.remove('navbar--initial');

    if (currentScrollY > lastScrollY) {
      // Scrolling down — show navbar
      navbar.classList.remove('navbar--hidden');
    } else {
      // Scrolling up — hide navbar
      navbar.classList.add('navbar--hidden');
    }
    lastScrollY = currentScrollY;
  });

  /* ── Accordion ── */
  document.querySelectorAll('.accordion__header').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.accordion__item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.accordion__header').forEach(b => b.setAttribute('aria-expanded', 'false'));

      // Open clicked (if it was closed)
      if (!isOpen) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
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

  window.addEventListener('scroll', () => {
    targetOffset = window.scrollY * SPEED;
  });

  function buildWave(phase) {
    const pts = 120;
    let d = '';
    for (let i = 0; i <= pts; i++) {
      const x = (i / pts) * VW;
      const y = BASE_Y + Math.sin((x / VW) * Math.PI * 2 * FREQ + phase) * AMP;
      d += i === 0 ? `M ${x},${y} ` : `L ${x},${y} `;
    }
    return d;
  }

  function animateWaves() {
    currentOffset += (targetOffset - currentOffset) * 0.06;
    const phase = currentOffset * 0.01;
    const wave = buildWave(phase);

    // Section dividers
    document.querySelectorAll('.wave-divider').forEach(divider => {
      const wavePath = divider.querySelector('.wavePath');
      const fillPath = divider.querySelector('.fillPath');
      if (wavePath) wavePath.setAttribute('d', wave);
      if (fillPath) fillPath.setAttribute('d', wave + ` L ${VW},${VH * 2} L 0,${VH * 2} Z`);
    });

    requestAnimationFrame(animateWaves);
  }

  animateWaves();

});

/* ══════════════════════════════════════
   BLOB CAROUSELS
   ══════════════════════════════════════ */

const WORKSHOP_IMAGES = [
  'images/people%20at%20workshop/people%20at%20workshop%201.png',
  'images/people%20at%20workshop/people%20at%20workshop%202.png',
  'images/people%20at%20workshop%204.png',
  'images/Pro%20v3%20-%20Large%20Group.png',
  'images/people%20at%20workshop/people%20at%20workshop%203.png',
];

const CHOCOLATE_IMAGES = [
  'images/chocolate%20pictures/chocolate%20picture%201.png',
  'images/chocolate%20pictures/chocolate%20picture%202.png',
  'images/chocolate%20pictures/chocolate%20picture%203.png',
  'images/chocolate%20pictures/chocolate%20picture%204.png',
  'images/chocolate%20pictures/chocolate%20picture%205.png',
  'images/chocolate%20pictures/chocolate%20picture%206.png',
  'images/chocolate%20pictures/chocolate%20picture%207.png',
  'images/chocolate%20pictures/chocolate%20picture%208.png',
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
