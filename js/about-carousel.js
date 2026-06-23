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
  let isPlaying = false;

  function initSlides() {
    if (!viewport) return;

    slides = [...viewport.querySelectorAll('.about-carousel__slide')];
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === 0);
      slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });
  }

  function syncProgressAttrs() {
    if (!progressBar) return;

    progressBar.setAttribute('aria-valuemin', '1');
    progressBar.setAttribute('aria-valuemax', String(slides.length));
    progressBar.setAttribute('aria-valuenow', String(index + 1));
  }

  function clearTimer() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    progressFill?.classList.remove('is-animating');
  }

  function runProgressAnimation() {
    if (!progressFill || reduceMotion || slides.length < 2) return;

    progressFill.classList.remove('is-animating');
    progressFill.style.width = '0%';
    progressFill.style.setProperty('--duration', `${intervalMs}ms`);
    void progressFill.offsetWidth;
    progressFill.classList.add('is-animating');
  }

  function queueAdvance() {
    clearTimer();
    if (!isPlaying || reduceMotion || slides.length < 2 || document.hidden) return;

    runProgressAnimation();
    timer = window.setTimeout(() => {
      goTo(index + 1);
      queueAdvance();
    }, intervalMs);
  }

  function goTo(nextIndex) {
    if (!slides.length) return;

    const wrapped = (nextIndex + slides.length) % slides.length;
    if (wrapped === index) return;

    slides[index].classList.remove('is-active');
    slides[index].setAttribute('aria-hidden', 'true');

    index = wrapped;

    slides[index].classList.add('is-active');
    slides[index].setAttribute('aria-hidden', 'false');
    syncProgressAttrs();

    if (reduceMotion && progressFill) {
      progressFill.style.width = '100%';
    }
  }

  function next() {
    goTo(index + 1);
    queueAdvance();
  }

  function prev() {
    goTo(index - 1);
    queueAdvance();
  }

  function startAutoplay() {
    if (reduceMotion || slides.length < 2) return;
    isPlaying = true;
    queueAdvance();
  }

  function pauseTimer() {
    clearTimer();
  }

  initSlides();
  syncProgressAttrs();

  if (reduceMotion && progressFill) {
    progressFill.style.width = '100%';
  }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  });

  root.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0]?.clientX ?? 0;
    pauseTimer();
  }, { passive: true });

  root.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const delta = touchEndX - touchStartX;

    if (Math.abs(delta) > 40) {
      if (delta < 0) next();
      else prev();
      return;
    }

    if (isPlaying) queueAdvance();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseTimer();
      return;
    }
    if (isPlaying) queueAdvance();
  });

  startAutoplay();
})();
