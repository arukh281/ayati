(function () {
  'use strict';

  const GALLERIES = {
    'ayati-greens-1': {
      title: 'Ayati Greens 1 · 3D images',
      images: [
        {
          src: 'images/webp/gallery-04-green-day-1200.webp',
          fallback: 'images/photos/about-carousel/04-ayati-green-day.png',
          alt: 'Ayati Greens 1 daytime exterior render',
          caption: 'Day exterior',
        },
        {
          src: 'images/webp/gallery-05-green-zoom-1200.webp',
          fallback: 'images/photos/about-carousel/05-ayati-green-zoom.jpg',
          alt: 'Ayati Greens 1 close-up exterior view',
          caption: 'Close view',
        },
        {
          src: 'images/webp/gallery-06-aerial-1-1200.webp',
          fallback: 'images/photos/about-carousel/06-ayati-green-aerial-1.png',
          alt: 'Ayati Greens 1 bird\'s-eye aerial view',
          caption: 'Bird\'s-eye view',
        },
        {
          src: 'images/webp/gallery-07-aerial-2-1200.webp',
          fallback: 'images/photos/about-carousel/07-ayati-green-aerial-2.png',
          alt: 'Ayati Greens 1 campus aerial perspective',
          caption: 'Aerial perspective',
        },
        {
          src: 'images/webp/gallery-08-top-1200.webp',
          fallback: 'images/photos/about-carousel/08-ayati-green-top.png',
          alt: 'Ayati Greens 1 top-down site view',
          caption: 'Top view',
        },
        {
          src: 'images/webp/gallery-09-floor-plate-1200.webp',
          fallback: 'images/photos/about-carousel/09-ayati-green-floor-plate.png',
          alt: 'Ayati Greens 1 floor plate bird\'s-eye view',
          caption: 'Floor plate',
        },
      ],
    },
  };

  const modal = document.getElementById('project-views-modal');
  if (!modal) return;

  const titleEl = document.getElementById('project-views-modal-title');
  const imageEl = modal.querySelector('[data-views-gallery-image]');
  const captionEl = modal.querySelector('[data-views-gallery-caption]');
  const counterEl = modal.querySelector('[data-views-gallery-counter]');
  const stageEl = modal.querySelector('[data-views-gallery-stage]');

  let gallery = null;
  let index = 0;
  let isOpen = false;
  let _galleryTriggerEl = null;

  function renderSlide() {
    if (!gallery || !imageEl) return;

    const slide = gallery.images[index];
    imageEl.onerror = slide.fallback ? () => { imageEl.onerror = null; imageEl.src = slide.fallback; } : null;
    imageEl.src = slide.src;
    imageEl.alt = slide.alt;

    if (captionEl) captionEl.textContent = slide.caption;
    if (counterEl) counterEl.textContent = `${index + 1} / ${gallery.images.length}`;
    if (stageEl) stageEl.setAttribute('aria-label', `${slide.caption} (${index + 1} of ${gallery.images.length})`);
  }

  function goTo(nextIndex) {
    if (!gallery?.images.length) return;
    index = (nextIndex + gallery.images.length) % gallery.images.length;
    renderSlide();
  }

  function openGallery(id, triggerEl) {
    const config = GALLERIES[id];
    if (!config?.images.length) return;

    gallery = config;
    index = 0;
    _galleryTriggerEl = triggerEl || null;

    if (titleEl) titleEl.textContent = config.title;
    renderSlide();

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('project-views-modal-open');
    isOpen = true;
    window.AyatiA11y?.trapFocus(modal);
    requestAnimationFrame(() => {
      // The backdrop div carries data-views-gallery-close too — target the button.
      modal.querySelector('button[data-views-gallery-close]')?.focus();
    });
  }

  function closeGallery() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-views-modal-open');
    isOpen = false;
    gallery = null;
    if (imageEl) imageEl.removeAttribute('src');
    window.AyatiA11y?.releaseFocus();
    _galleryTriggerEl?.focus();
    _galleryTriggerEl = null;
  }

  document.querySelectorAll('[data-views-gallery-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openGallery(btn.dataset.viewsGalleryOpen || '', btn);
    });
  });

  modal.querySelectorAll('[data-views-gallery-close]').forEach((el) => {
    el.addEventListener('click', closeGallery);
  });

  modal.querySelector('[data-views-gallery-prev]')?.addEventListener('click', () => goTo(index - 1));
  modal.querySelector('[data-views-gallery-next]')?.addEventListener('click', () => goTo(index + 1));

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
  });
})();
