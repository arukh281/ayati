(function () {
  'use strict';

  const root = document.querySelector('[data-about-carousel]');
  if (!root) return;

  const viewport = root.querySelector('[data-carousel-viewport]');
  const label = root.querySelector('[data-carousel-label]');
  const dotsRoot = root.querySelector('[data-carousel-dots]');
  const prevBtn = root.querySelector('[data-carousel-prev]');
  const nextBtn = root.querySelector('[data-carousel-next]');

  const slides = [...root.querySelectorAll('.about-carousel__slide')];
  let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
  if (index < 0) index = 0;

  let touchStartX = 0;
  let isTransitioning = false;

  function buildDots() {
    if (!dotsRoot) return;
    dotsRoot.innerHTML = '';
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'about-carousel__dot';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Show image ${i + 1} of ${slides.length}`);
      btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
      if (i === index) btn.classList.add('is-active');
      btn.addEventListener('click', () => goTo(i));
      dotsRoot.appendChild(btn);
    });
  }

  function sync() {
    const activeSlide = slides[index];
    
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    if (label && activeSlide) {
      label.textContent = activeSlide.dataset.caption || '';
    }

    dotsRoot?.querySelectorAll('.about-carousel__dot').forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    isTransitioning = false;
  }

  function goTo(nextIndex) {
    if (!slides.length || isTransitioning) return;
    
    isTransitioning = true;
    index = (nextIndex + slides.length) % slides.length;
    sync();
  }

  prevBtn?.addEventListener('click', () => goTo(index - 1));
  nextBtn?.addEventListener('click', () => goTo(index + 1));

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
  });

  viewport?.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? 0;
    },
    { passive: true },
  );

  viewport?.addEventListener(
    'touchend',
    (event) => {
      const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX;
      if (Math.abs(delta) < 40) return;
      goTo(delta < 0 ? index + 1 : index - 1);
    },
    { passive: true },
  );

  root.setAttribute('tabindex', '0');
  buildDots();
  sync();
})();
