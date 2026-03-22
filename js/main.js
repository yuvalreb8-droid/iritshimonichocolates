/* ========================================
   CHOCOLATE WORKSHOP — MAIN JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initWaveMorphing();
  initWorkshopSlideshow();
  initAccordion();
  initContactForm();
  initScrollReveal();
  initBlobReveal();
});

/* ========================================
   SVG WAVE PATH MORPHING
   Smooth scroll-driven wave animation
   using SVG path interpolation
   ======================================== */
function initWaveMorphing() {
  const dividers = document.querySelectorAll('.wave-divider');
  if (!dividers.length) return;

  const waveInstances = [];

  dividers.forEach(divider => {
    const layers = divider.querySelectorAll('.wave-layer');

    layers.forEach(layer => {
      const pathA = layer.getAttribute('d');
      const pathB = layer.getAttribute('data-morph');
      if (!pathA || !pathB) return;

      const numbersA = extractNumbers(pathA);
      const numbersB = extractNumbers(pathB);

      if (numbersA.length !== numbersB.length) return;

      // Build a template string with placeholders
      const template = buildTemplate(pathA, numbersA);

      waveInstances.push({
        element: layer,
        dividerEl: divider,
        numbersA: numbersA,
        numbersB: numbersB,
        template: template,
        currentProgress: 0,
      });
    });
  });

  if (!waveInstances.length) return;

  let ticking = false;

  function updateMorphing() {
    const scrollY = window.scrollY;
    const viewportH = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight - viewportH;

    waveInstances.forEach(wave => {
      const rect = wave.dividerEl.getBoundingClientRect();
      const dividerCenter = rect.top + rect.height / 2;

      // Calculate progress based on divider position relative to viewport
      // When divider is at bottom of viewport → 0, at top → 1
      // This creates smooth morphing as you scroll past each wave
      let progress = 1 - (dividerCenter / viewportH);

      // Also add a subtle continuous oscillation based on total scroll
      const oscillation = Math.sin(scrollY * 0.003) * 0.15;

      // Combine position-based morph with scroll oscillation
      progress = Math.max(0, Math.min(1, progress + oscillation));

      // Smooth the progress with easing
      progress = easeInOutSine(progress);

      // Only update if progress changed enough (performance)
      if (Math.abs(progress - wave.currentProgress) < 0.002) return;
      wave.currentProgress = progress;

      // Interpolate between path A and path B
      const interpolated = wave.numbersA.map((a, i) => {
        return a + (wave.numbersB[i] - a) * progress;
      });

      // Build the new path string
      const newPath = applyTemplate(wave.template, interpolated);
      wave.element.setAttribute('d', newPath);
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateMorphing);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial render
  updateMorphing();
}

/* --- Path parsing utilities --- */

// Extract all numbers (including negatives and decimals) from a path string
function extractNumbers(pathStr) {
  const matches = pathStr.match(/-?\d+\.?\d*/g);
  return matches ? matches.map(Number) : [];
}

// Build a template with {0}, {1}, {2}... placeholders where numbers were
function buildTemplate(pathStr, numbers) {
  let template = pathStr;
  let idx = 0;

  // Replace each number with a unique placeholder
  // We need to be careful to replace in order and not re-match placeholders
  template = template.replace(/-?\d+\.?\d*/g, () => {
    return `{${idx++}}`;
  });

  return template;
}

// Apply interpolated numbers back into the template
function applyTemplate(template, numbers) {
  let result = template;
  for (let i = 0; i < numbers.length; i++) {
    result = result.replace(`{${i}}`, Math.round(numbers[i] * 10) / 10);
  }
  return result;
}

// Easing function for smooth, organic feel
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/* ========================================
   BLOB REVEAL ON SCROLL
   ======================================== */
function initBlobReveal() {
  const blobs = document.querySelectorAll('.blob');
  if (!blobs.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  blobs.forEach(blob => observer.observe(blob));
}

/* ========================================
   WORKSHOP SLIDESHOW (SCROLL-DRIVEN FADE)
   ======================================== */
function initWorkshopSlideshow() {
  const workshop = document.getElementById('workshop');
  if (!workshop) return;

  const slides = workshop.querySelectorAll('.workshop__slide');
  const dots = workshop.querySelectorAll('.workshop__dot');
  const totalSlides = slides.length;
  let currentSlide = 0;

  function setActiveSlide(index) {
    if (index === currentSlide) return;

    slides.forEach((slide, i) => {
      slide.classList.toggle('workshop__slide--active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('workshop__dot--active', i === index);
    });

    currentSlide = index;
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index, 10);
      setActiveSlide(index);
    });
  });

  function onScroll() {
    const rect = workshop.getBoundingClientRect();
    const workshopTop = window.scrollY + rect.top;
    const scrollInSection = window.scrollY - workshopTop;
    const sectionHeight = workshop.offsetHeight - window.innerHeight;

    if (scrollInSection < 0 || scrollInSection > sectionHeight) return;

    const progress = scrollInSection / sectionHeight;
    const slideIndex = Math.min(
      Math.floor(progress * totalSlides),
      totalSlides - 1
    );

    setActiveSlide(slideIndex);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ========================================
   ACCORDION
   ======================================== */
function initAccordion() {
  const items = document.querySelectorAll('.accordion__item');

  items.forEach(item => {
    const header = item.querySelector('.accordion__header');

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.accordion__header').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      header.setAttribute('aria-expanded', !isOpen);
    });
  });
}

/* ========================================
   CONTACT FORM
   ======================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('#name').value.trim();
    const phone = form.querySelector('#phone').value.trim();

    if (!name || !phone) {
      alert('אנא מלאו שם וטלפון.');
      return;
    }

    alert('תודה! נחזור אליכם בהקדם.');
    form.reset();
  });
}

/* ========================================
   SCROLL REVEAL
   ======================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.about, .qa, .contact');

  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach(el => observer.observe(el));
}
