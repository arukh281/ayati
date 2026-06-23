/**
 * 3D floor plan modal — opens immediately; loads Three.js on demand.
 */
(function () {
  const MODELS = {
    'aadhya-residency': {
      title: 'Aadya Residency · 3D floor plan',
      ariaLabel: 'Interactive 3D floor plan of Aadya Residency',
      src: 'images/models/Untitled2.glb',
      viewSettings: {
        zoom: 0.234,
        center: { x: 11.4, y: 0.9, z: -3.9 },
      },
    },
    'ayati-green-1': {
      title: 'Ayati Greens 1 · 3D model',
      ariaLabel: 'Interactive 3D model of Ayati Greens 1',
      src: 'images/models/ayati-green.glb?v=20260623',
      viewSettings: null,
    },
  };

  const modal = document.getElementById('floor-plan-modal');
  const container = document.getElementById('floor-plan-canvas');
  const loader = document.getElementById('floor-plan-loader');
  const loaderText = loader?.querySelector('.floor-plan-modal__loader-text');
  const titleEl = document.getElementById('floor-plan-modal-title');

  if (!modal || !container) return;

  let isOpen = false;
  let isLoaded = false;
  let isLoading = false;
  let loadedModelId = null;
  let viewer = null;
  let viewerPromise = null;
  let activeTool = 'rotate';

  function getModelConfig(modelId) {
    return MODELS[modelId] || MODELS['aadhya-residency'];
  }

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

  function updateModalCopy(modelId) {
    const config = getModelConfig(modelId);
    if (titleEl) titleEl.textContent = config.title;
    container.setAttribute('aria-label', config.ariaLabel);
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

  async function loadModel(modelId) {
    const config = getModelConfig(modelId);
    if (isLoaded && loadedModelId === modelId) return;
    if (isLoading) return;

    isLoading = true;
    setLoader('Loading 3D viewer…', true);

    try {
      if (window.location.protocol === 'file:') {
        throw new Error('Open the site via http://localhost:8765 — not as a local file.');
      }

      await waitForLayout();
      const v = await getViewer();
      v.resize();

      if (loadedModelId && loadedModelId !== modelId) {
        v.unloadModel();
        isLoaded = false;
      }

      const loadingMessage = modelId === 'ayati-green-1'
        ? 'Loading Ayati Greens 1 model… first load may take a few minutes.'
        : 'Loading 3D model… first load may take a minute.';
      setLoader(loadingMessage, true);

      await v.loadModel(config.src, config.viewSettings);
      await waitForLayout();
      v.refit();
      loadedModelId = modelId;
      isLoaded = true;
      hideLoader();
    } catch (err) {
      console.error('Floor plan viewer error:', err);
      const msg = err?.message || 'Could not load the 3D viewer.';
      setLoader(msg, false);
      isLoaded = false;
      loadedModelId = null;
    } finally {
      isLoading = false;
    }
  }

  function openModal(modelId) {
    const id = modelId || 'aadhya-residency';
    updateModalCopy(id);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('floor-plan-modal-open');
    isOpen = true;
    loadModel(id).then(() => viewer?.start());
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
      openModal(btn.dataset.floorPlanOpen || 'aadhya-residency');
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
