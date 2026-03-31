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

/* ── Gallery / Lightbox ── */
function openGallery(type) {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.classList.add('active');
}

function closeLightbox(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('lightbox__close')) return;
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.classList.remove('active');
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) lightbox.classList.remove('active');
  }
});
