/**
 * 3D floor plan modal — opens immediately; loads Three.js on demand.
 */
(function () {
  const modal = document.getElementById('floor-plan-modal');
  const container = document.getElementById('floor-plan-canvas');
  const loader = document.getElementById('floor-plan-loader');
  const loaderText = loader?.querySelector('.floor-plan-modal__loader-text');

  if (!modal || !container) return;

  let isOpen = false;
  let isLoaded = false;
  let isLoading = false;
  let viewer = null;
  let viewerPromise = null;
  let activeTool = 'rotate';

  function setLoader(message, showSpinner) {
    if (!loader || !loaderText) return;
    loaderText.textContent = message;
    loader.hidden = false;
    loader.dataset.state = showSpinner ? 'loading' : 'error';
  }

  function hideLoader() {
    if (loader) loader.hidden = true;
  }

  function waitForLayout() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  function setActiveTool(tool) {
    activeTool = tool;
    container.dataset.tool = tool;
    document.querySelectorAll('[data-viewer-tool]').forEach((btn) => {
      const isActive = btn.dataset.viewerTool === tool;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    viewer?.setTool(tool);
  }

  async function getViewer() {
    if (viewer) return viewer;
    if (!viewerPromise) {
      viewerPromise = import('/js/floor-plan-viewer.mjs')
        .then((mod) => {
          viewer = mod.createFloorPlanViewer(container);
          viewer.setTool(activeTool);
          return viewer;
        })
        .catch((err) => {
          viewerPromise = null;
          throw err;
        });
    }
    return viewerPromise;
  }

  async function loadModel() {
    if (isLoaded || isLoading) return;
    isLoading = true;
    setLoader('Loading 3D viewer…', true);

    try {
      if (window.location.protocol === 'file:') {
        throw new Error('Open the site via http://localhost:8765 — not as a local file.');
      }

      await waitForLayout();
      const v = await getViewer();
      v.resize();
      setLoader('Loading 3D model… first load may take a minute.', true);
      await v.loadModel();
      await waitForLayout();
      v.refit();
      isLoaded = true;
      hideLoader();
    } catch (err) {
      console.error('Floor plan viewer error:', err);
      const msg = err?.message || 'Could not load the 3D viewer.';
      setLoader(msg, false);
    } finally {
      isLoading = false;
    }
  }

  function openModal() {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('floor-plan-modal-open');
    isOpen = true;
    loadModel().then(() => viewer?.start());
    waitForLayout().then(() => viewer?.resize());
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('floor-plan-modal-open');
    isOpen = false;
    viewer?.stop();
  }

  document.querySelectorAll('[data-viewer-tool]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveTool(btn.dataset.viewerTool);
    });
  });

  document.querySelectorAll('[data-viewer-zoom]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.dataset.viewerZoom === 'in') viewer?.zoomIn();
      else viewer?.zoomOut();
    });
  });

  document.querySelector('.floor-plan-toolbar')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
  });

  document.querySelectorAll('[data-floor-plan-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });
  });

  document.querySelectorAll('[data-floor-plan-recenter]').forEach((btn) => {
    btn.addEventListener('click', () => viewer?.recenter());
  });

  modal.querySelectorAll('[data-floor-plan-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeModal();
  });

  window.addEventListener('resize', () => {
    if (isOpen) viewer?.resize();
  });
})();
