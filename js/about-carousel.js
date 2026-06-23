(function () {
  'use strict';

  const root = document.querySelector('[data-about-carousel]');
  if (!root) return;

  const viewport = root.querySelector('.about-carousel__viewport');
  const progressBar = root.querySelector('[data-carousel-progressbar]');
  const progressFill = root.querySelector('[data-carousel-progress]');
  const prevBtn = root.querySelector('[data-carousel-prev]');
  const nextBtn = root.querySelector('[data-carousel-next]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intervalMs = 2800;

  let slides = [];
  let index = 0;
  let timer = null;
  let touchStartX = 0;

  function initSlides() {
    if (!viewport) return;

    slides = [...viewport.querySelectorAll('.about-carousel__slide')];
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === 0);
      slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });
  }

  function updateProgress() {
    if (!progressBar || !progressFill) return;

    progressBar.setAttribute('aria-valuemax', String(slides.length));
    progressBar.setAttribute('aria-valuenow', String(index + 1));

    progressFill.classList.remove('is-animating');
    progressFill.style.width = reduceMotion ? '100%' : '0%';

    if (reduceMotion || slides.length < 2) return;

    progressFill.style.setProperty('--duration', `${intervalMs}ms`);
    requestAnimationFrame(() => {
      progressFill.classList.add('is-animating');
    });
  }

  function goTo(nextIndex, userTriggered = false) {
    if (!slides.length) return;

    const wrapped = (nextIndex + slides.length) % slides.length;
    if (wrapped === index) return;

    slides[index].classList.remove('is-active');
    slides[index].setAttribute('aria-hidden', 'true');

    index = wrapped;

    slides[index].classList.add('is-active');
    slides[index].setAttribute('aria-hidden', 'false');
    updateProgress();

    if (userTriggered) restartAutoplay();
  }

  function next(userTriggered = false) {
    goTo(index + 1, userTriggered);
  }

  function prev(userTriggered = false) {
    goTo(index - 1, userTriggered);
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    progressFill?.classList.remove('is-animating');
  }

  function startAutoplay() {
    if (reduceMotion || slides.length < 2) return;
    stopAutoplay();
    updateProgress();
    timer = window.setInterval(() => next(false), intervalMs);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  initSlides();
  updateProgress();

  prevBtn?.addEventListener('click', () => prev(true));
  nextBtn?.addEventListener('click', () => next(true));

  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);
  root.addEventListener('focusin', stopAutoplay);
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) startAutoplay();
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev(true);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next(true);
    }
  });

  root.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0]?.clientX ?? 0;
    stopAutoplay();
  }, { passive: true });

  root.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) > 40) {
      if (delta < 0) next(true);
      else prev(true);
    } else {
      startAutoplay();
    }
  }, { passive: true });

  startAutoplay();
})();
