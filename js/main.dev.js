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

  /* ── Navbar: touch-linked 1:1 hide/show ── */
  const navbarHeight = navbar.offsetHeight + 10;
  const maxOffset = navbarHeight * 1.1;
  let navOffset = maxOffset;
  let lastTouchY = 0;
  let isTouching = false;

  navbar.style.transform = `translateY(-${maxOffset}px)`;

  window.addEventListener('touchstart', (e) => {
    if (!e.touches.length) return;
    lastTouchY = e.touches[0].clientY;
    isTouching = true;
    // Force disable transition during drag
    navbar.style.setProperty('transition', 'none', 'important');
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isTouching || !e.touches.length) return;
    const touchY = e.touches[0].clientY;
    const delta = lastTouchY - touchY;
    lastTouchY = touchY;

    // Hide at top of page
    if (window.scrollY <= 5) {
      navOffset = maxOffset;
      navbar.style.transform = `translateY(-${maxOffset}px)`;
      return;
    }

    navOffset = Math.max(0, Math.min(maxOffset, navOffset + delta));
    navbar.style.transform = `translateY(-${navOffset}px)`;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isTouching = false;
    // Re-enable transition for snap
    navbar.style.removeProperty('transition');

    if (navOffset > maxOffset * 0.5) {
      navbar.style.transition = 'transform 0.52s ease';
      navOffset = maxOffset;
    } else {
      navbar.style.transition = 'transform 0.33s ease';
      navOffset = 0;
    }
    navbar.style.transform = `translateY(-${navOffset}px)`;
  }, { passive: true });

  // Desktop scroll — lerp-based fluid follow (stops when idle)
  const DESKTOP_FACTOR = 0.25;
  const DESKTOP_LERP = 0.08;
  let deskLastScrollY = window.scrollY;
  let deskTarget = -navbarHeight;
  let deskCurrent = -navbarHeight;
  let deskAnimating = false;

  window.addEventListener('scroll', () => {
    if (isTouching) return;
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - deskLastScrollY;
    deskLastScrollY = currentScrollY;

    if (currentScrollY < 10) {
      deskTarget = -navbarHeight;
    } else {
      deskTarget += delta * DESKTOP_FACTOR;
      deskTarget = Math.max(-navbarHeight, Math.min(0, deskTarget));
    }

    if (!deskAnimating) {
      deskAnimating = true;
      requestAnimationFrame(renderDesktopNavbar);
    }
  }, { passive: true });

  function renderDesktopNavbar() {
    if (isTouching) { deskAnimating = false; return; }
    deskCurrent += (deskTarget - deskCurrent) * DESKTOP_LERP;
    if (Math.abs(deskCurrent - deskTarget) < 0.5) {
      deskCurrent = deskTarget;
      deskAnimating = false;
    }
    navbar.style.transform = `translateY(${deskCurrent}px)`;
    if (deskAnimating) requestAnimationFrame(renderDesktopNavbar);
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
     SCROLL-REACTIVE WAVE DIVIDERS
     Pre-rendered once, animated with CSS transform (compositor-only, 60fps)
     ══════════════════════════════════════ */
  const VW = 1440, VH = 160;
  const AMP = 28;
  const FREQ = 0.8;
  const BASE_Y = VH * 0.55;
  const TWO_PI_FREQ = Math.PI * 2 * FREQ;
  const WAVE_PTS = 60;

  // Build wave path ONCE
  function buildWave() {
    let d = '';
    for (let i = 0; i <= WAVE_PTS; i++) {
      const x = (i / WAVE_PTS) * VW;
      const y = BASE_Y + Math.sin((x / VW) * TWO_PI_FREQ) * AMP;
      d += i === 0 ? `M ${x},${y} ` : `L ${x},${y} `;
    }
    return d;
  }

  const wave = buildWave();

  // Set static paths once — never touched again
  const waveSvgs = [];
  document.querySelectorAll('.wave-divider').forEach(divider => {
    const wavePath = divider.querySelector('.wavePath');
    const fillPath = divider.querySelector('.fillPath');
    const svg = divider.querySelector('svg');
    if (wavePath) wavePath.setAttribute('d', wave);
    if (fillPath && divider.id === 'wave2') {
      fillPath.setAttribute('d', wave + ` L ${VW},${VH + 20} L 0,${VH + 20} Z`);
    } else if (fillPath && divider.id !== 'wave1') {
      fillPath.setAttribute('d', wave + ` L ${VW},${VH * 2} L 0,${VH * 2} Z`);
    }
    if (svg) waveSvgs.push(svg);
  });

  // Animate with CSS transform on scroll — compositor-only, 60fps guaranteed
  window.addEventListener('scroll', () => {
    const shift = -(window.scrollY * 0.15);
    for (let i = 0; i < waveSvgs.length; i++) {
      waveSvgs[i].style.transform = `translateX(${shift}px)`;
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
