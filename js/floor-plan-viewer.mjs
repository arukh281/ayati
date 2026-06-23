/**
 * Three.js viewer module — loaded on demand when user opens the 3D modal.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEFAULT_VIEW_DIR = new THREE.Vector3(1, 1, 1).normalize();

const COLOR_TEXTURE_KEYS = ['map', 'emissiveMap', 'sheenColorMap', 'specularColorMap'];
const DATA_TEXTURE_KEYS = [
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'alphaMap',
  'lightMap',
];

function createSkyTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#3a6f9e');
  sky.addColorStop(0.42, '#6fa3cc');
  sky.addColorStop(0.66, '#c5dceb');
  sky.addColorStop(0.78, '#e8e4d8');
  sky.addColorStop(1, '#b8b2a4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.32;
  const clouds = [
    [0.12, 0.22, 170],
    [0.32, 0.16, 210],
    [0.52, 0.28, 150],
    [0.7, 0.2, 190],
    [0.86, 0.32, 130],
  ];
  for (const [nx, ny, r] of clouds) {
    const cx = nx * width;
    const cy = ny * height;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.7, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

export function createFloorPlanViewer(container) {
  let scene;
  let camera;
  let renderer;
  let controls;
  let model = null;
  let defaultView = null;
  let animationId = null;
  let fitRadius = 100;
  let baseFitDistance = 100;
  let viewDirection = DEFAULT_VIEW_DIR.clone();
  let sunLight = null;
  let fillLight = null;
  let skyTexture = null;
  let floorY = 0;
  let activeTool = 'rotate';
  let suppressViewSync = false;
  let activeViewSettings = null;
  let modelSrc = null;

  function getMeshSize(node) {
    if (!node.geometry) return null;
    node.geometry.computeBoundingBox();
    const box = node.geometry.boundingBox;
    if (!box) return null;
    return box.getSize(new THREE.Vector3());
  }

  function isThinShell(size) {
    if (!size) return false;
    const dims = [size.x, size.y, size.z].sort((a, b) => a - b);
    return dims[0] < dims[2] * 0.04;
  }

  function isFlatSurface(size) {
    if (!size) return false;
    const horizontal = Math.max(size.x, size.z);
    return size.y < horizontal * 0.08 && horizontal > 1;
  }

  function prepareModel(root) {
    const maxAniso = renderer?.capabilities?.getMaxAnisotropy?.() ?? 8;

    root.traverse((node) => {
      if (!node.isMesh) return;
      node.frustumCulled = false;

      const size = getMeshSize(node);
      const thinShell = isThinShell(size);
      const flatSurface = isFlatSurface(size);

      const fix = (mat) => {
        if (!mat) return;

        mat.side = thinShell ? THREE.DoubleSide : THREE.FrontSide;
        mat.depthTest = true;
        mat.depthWrite = !mat.transparent;

        if (flatSurface) {
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = 1;
          mat.polygonOffsetUnits = 1;
        }

        for (const key of COLOR_TEXTURE_KEYS) {
          const tex = mat[key];
          if (!tex) continue;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAniso;
        }

        for (const key of DATA_TEXTURE_KEYS) {
          const tex = mat[key];
          if (!tex) continue;
          tex.colorSpace = THREE.NoColorSpace;
          tex.anisotropy = maxAniso;
        }

        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
          mat.envMapIntensity = 0;
          mat.metalness = Math.min(mat.metalness ?? 0, 0.2);
          mat.roughness = Math.max(mat.roughness ?? 0.5, 0.45);
        }

        mat.needsUpdate = true;
      };

      if (Array.isArray(node.material)) node.material.forEach(fix);
      else fix(node.material);

      node.renderOrder = flatSurface ? 0 : 1;

      if (node.geometry) {
        if (!node.geometry.attributes.normal) {
          node.geometry.computeVertexNormals();
        }
        node.geometry.computeBoundingBox();
        node.geometry.computeBoundingSphere();
      }
    });
  }

  function getSize() {
    return {
      w: Math.max(container.clientWidth, 1),
      h: Math.max(container.clientHeight, 1),
    };
  }

  function getWorldBox(root) {
    root.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(root);
  }

  function computeBaseDistance() {
    const { w, h } = getSize();
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (w / h));
    return Math.max(
      fitRadius / Math.sin(vFov / 2),
      fitRadius / Math.sin(hFov / 2)
    );
  }

  function captureViewDirection() {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const len = offset.length();
    if (len > 1e-6) viewDirection.copy(offset.divideScalar(len));
  }

  function applyCameraFromSettings(zoom, center, { resetDirection = false } = {}) {
    const dist = baseFitDistance * zoom;
    if (resetDirection) viewDirection.copy(DEFAULT_VIEW_DIR);

    controls.target.set(center.x, center.y, center.z);
    camera.position.copy(controls.target).add(viewDirection.clone().multiplyScalar(dist));
    controls.minDistance = fitRadius * 0.02;
    controls.maxDistance = fitRadius * 50;
    controls.update();

    defaultView = getCurrentView();
  }

  function getViewDefaults() {
    if (!model) {
      return { zoom: 1, center: { x: 0, y: 0, z: 0 } };
    }

    const box = getWorldBox(model);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    return {
      zoom: 1,
      center: {
        x: sphere.center.x,
        y: sphere.center.y,
        z: sphere.center.z,
      },
    };
  }

  function resolveViewSettings(viewSettings) {
    if (viewSettings?.zoom != null && viewSettings?.center) return viewSettings;
    return getViewDefaults();
  }

  function frameToBox(box) {
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    fitRadius = Math.max(sphere.radius, 1);
    baseFitDistance = computeBaseDistance();

    updateCameraPlanes();

    const resolved = resolveViewSettings(activeViewSettings);
    applyCameraFromSettings(resolved.zoom, resolved.center, { resetDirection: true });

    setupFloorCap(box);

    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;

    if (sunLight) sunLight.position.set(fitRadius * 1.5, fitRadius * 4, fitRadius * 1.2);
    if (fillLight) fillLight.position.set(-fitRadius * 2.5, fitRadius * 1.5, -fitRadius * 2);
  }

  function getCurrentView() {
    if (!camera || !controls) {
      return resolveViewSettings(activeViewSettings);
    }

    const dist = camera.position.distanceTo(controls.target);
    const zoom = baseFitDistance > 0 ? dist / baseFitDistance : resolveViewSettings(activeViewSettings).zoom;

    return {
      zoom: Math.round(zoom * 1000) / 1000,
      center: {
        x: Math.round(controls.target.x * 10) / 10,
        y: Math.round(controls.target.y * 10) / 10,
        z: Math.round(controls.target.z * 10) / 10,
      },
    };
  }

  function applyViewSettings({ zoom, center }) {
    if (!camera || !controls) return;

    const z = Number(zoom);
    const c = {
      x: Number(center?.x) || 0,
      y: Number(center?.y) || 0,
      z: Number(center?.z) || 0,
    };
    if (!Number.isFinite(z)) return;

    suppressViewSync = true;
    applyCameraFromSettings(z, c, { resetDirection: false });
    suppressViewSync = false;
  }

  function applyInteractionMode(tool) {
    if (!controls) return;
    activeTool = tool;

    if (tool === 'pan') {
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
      controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
      controls.touches.ONE = THREE.TOUCH.PAN;
      controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    } else {
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
      controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      controls.touches.ONE = THREE.TOUCH.ROTATE;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    }
  }

  function setTool(tool) {
    applyInteractionMode(tool === 'pan' ? 'pan' : 'rotate');
    container.dataset.tool = activeTool;
  }

  function setupFloorCap(box) {
    floorY = box.min.y;
  }

  function updateCameraPlanes() {
    if (!camera || !controls) return;

    const dist = Math.max(camera.position.distanceTo(controls.target), fitRadius * 0.05);
    camera.near = Math.max(dist * 0.002, 0.25);
    camera.far = Math.max(dist * 80, fitRadius * 30);
    camera.updateProjectionMatrix();
  }

  function clampCameraAboveFloor() {
    if (!camera || !controls) return;

    const minHeight = floorY + fitRadius * 0.02;
    if (camera.position.y < minHeight) {
      camera.position.y = minHeight;
      controls.update();
    }
  }

  function zoomBy(factor) {
    if (!camera || !controls) return;

    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const dist = offset.length();
    if (dist < 1e-6) return;

    const next = THREE.MathUtils.clamp(dist * factor, controls.minDistance, controls.maxDistance);
    offset.normalize().multiplyScalar(next);
    camera.position.copy(controls.target).add(offset);
    captureViewDirection();
    controls.update();
  }

  function zoomIn() {
    zoomBy(0.85);
  }

  function zoomOut() {
    zoomBy(1.18);
  }

  function setupEnvironment() {
    if (!renderer || !scene) return;

    skyTexture?.dispose();
    skyTexture = createSkyTexture();
    scene.background = skyTexture;
    scene.environment = null;
    scene.environmentIntensity = 0;
  }

  function disposeEnvironment() {
    skyTexture?.dispose();
    skyTexture = null;
  }

  function initScene() {
    if (renderer) return;

    scene = new THREE.Scene();

    const { w, h } = getSize();
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1e8);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    container.appendChild(renderer.domElement);

    setupEnvironment();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.screenSpacePanning = true;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;

    applyInteractionMode('rotate');

    controls.addEventListener('start', () => {
      container.classList.add('is-dragging');
    });

    controls.addEventListener('end', () => {
      container.classList.remove('is-dragging');
    });

    controls.addEventListener('change', () => {
      if (suppressViewSync) return;
      captureViewDirection();
      clampCameraAboveFloor();
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    scene.add(new THREE.HemisphereLight(0xf0f4f8, 0x8a8070, 0.35));

    const sun = new THREE.DirectionalLight(0xfff8f0, 1.05);
    sun.castShadow = false;
    scene.add(sun);
    sunLight = sun;

    const fill = new THREE.DirectionalLight(0xe8eef8, 0.28);
    scene.add(fill);
    fillLight = fill;

    const top = new THREE.DirectionalLight(0xffffff, 0.55);
    top.position.set(0, 1, 0);
    scene.add(top);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls?.update();
    updateCameraPlanes();
    clampCameraAboveFloor();
    renderer?.render(scene, camera);
  }

  function resize() {
    if (!renderer || !camera) return;
    const { w, h } = getSize();
    camera.aspect = w / h;
    updateCameraPlanes();
    renderer.setSize(w, h);
    if (model && controls) {
      const current = getCurrentView();
      captureViewDirection();
      baseFitDistance = computeBaseDistance();
      suppressViewSync = true;
      applyCameraFromSettings(current.zoom, current.center, { resetDirection: false });
      suppressViewSync = false;
    }
  }

  function refit() {
    if (!model || !camera) return;
    resize();
    frameToBox(getWorldBox(model));
  }

  function unloadModel() {
    if (!model || !scene) return;

    scene.remove(model);
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry?.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((mat) => mat?.dispose?.());
    });
    model = null;
    defaultView = null;
    modelSrc = null;
    activeViewSettings = null;
  }

  function loadModel(src, viewSettings = null) {
    return new Promise((resolve, reject) => {
      initScene();
      if (!animationId) animate();

      if (model && modelSrc !== src) unloadModel();

      modelSrc = src;
      activeViewSettings = viewSettings;

      if (model) {
        refit();
        resolve();
        return;
      }

      new GLTFLoader()
        .setDRACOLoader(
          new DRACOLoader().setDecoderPath(
            'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/libs/draco/gltf/'
          )
        )
        .load(
        src,
        (gltf) => {
          model = gltf.scene;
          prepareModel(model);
          scene.add(model);

          refit();
          requestAnimationFrame(() => {
            refit();
          });
          resolve();
        },
        undefined,
        (err) => reject(err || new Error('Model failed to load'))
      );
    });
  }

  function recenter() {
    if (defaultView) {
      applyViewSettings(defaultView);
      return;
    }
    applyViewSettings(defaultView || resolveViewSettings(activeViewSettings));
  }

  function dispose() {
    unloadModel();
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    controls?.dispose();
    disposeEnvironment();
    renderer?.dispose();
    renderer?.domElement?.remove();
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    model = null;
  }

  return {
    loadModel,
    unloadModel,
    resize,
    refit,
    recenter,
    setTool,
    zoomIn,
    zoomOut,
    dispose,
    start: () => { if (!animationId) animate(); },
    stop: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
  };
}
