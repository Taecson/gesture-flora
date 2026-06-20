import * as THREE from "three";

const QUALITY_PROFILES = [
  { label: "高", pixelRatioScale: 1, objectScale: 1 },
  { label: "均衡", pixelRatioScale: 0.82, objectScale: 0.78 },
  { label: "保护", pixelRatioScale: 0.66, objectScale: 0.58 }
];

const DEFAULT_STATS = {
  enabled: false,
  available: true,
  ready: false,
  fps: 0,
  frameTimeMs: 0,
  qualityLevel: 0,
  qualityLabel: QUALITY_PROFILES[0].label,
  qualityScale: 1,
  autoDisabled: false,
  renderCalls: 0,
  triangles: 0,
  points: 0,
  pearlObjects: 0,
  vineObjects: 0,
  branchObjects: 0,
  butterflyObjects: 0,
  width: 0,
  height: 0,
  pixelRatio: 1,
  warning: null,
  error: null
};

export class ThreeOverlay {
  constructor(config = {}) {
    this.config = config;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.cursorGroup = null;
    this.depthField = null;
    this.pearlGroup = null;
    this.pearlMeshes = new Map();
    this.pearlGeometry = null;
    this.pearlHighlightGeometry = null;
    this.pearlRimGeometry = null;
    this.pearlBodyMaterial = null;
    this.pearlHighlightMaterial = null;
    this.pearlRimMaterial = null;
    this.vineGroup = null;
    this.vineMeshes = new Map();
    this.vineStemGeometry = null;
    this.vineLeafGeometry = null;
    this.vineBudGeometry = null;
    this.vineStemMaterial = null;
    this.vineLeafMaterial = null;
    this.vineVeinMaterial = null;
    this.vineTendrilMaterial = null;
    this.vineBudMaterial = null;
    this.branchGroup = null;
    this.branchMeshes = new Map();
    this.branchStemGeometry = null;
    this.branchPetalGeometry = null;
    this.branchBudGeometry = null;
    this.branchCenterGeometry = null;
    this.branchStemMaterial = null;
    this.branchHighlightMaterial = null;
    this.branchPetalMaterial = null;
    this.branchPetalAccentMaterial = null;
    this.branchBudMaterial = null;
    this.branchCenterMaterial = null;
    this.butterflyGroup = null;
    this.butterflyMeshes = new Map();
    this.butterflyWingGeometry = null;
    this.butterflyLowerWingGeometry = null;
    this.butterflyBodyGeometry = null;
    this.butterflyTrailGeometry = null;
    this.butterflyAntennaGeometry = null;
    this.butterflyBodyMaterial = null;
    this.butterflyTrailMaterial = null;
    this.enabled = false;
    this.available = true;
    this.ready = false;
    this.lastFrameAt = 0;
    this.lastStatsAt = 0;
    this.lastQualityCheckAt = 0;
    this.performanceWarmupUntil = 0;
    this.slowQualitySamples = 0;
    this.qualityLevel = 0;
    this.frameCount = 0;
    this.stats = { ...DEFAULT_STATS };
  }

  setEnabled(enabled, width, height) {
    if (!enabled) {
      this.enabled = false;
      this.updateCanvasVisibility();
      this.syncStats();
      return false;
    }

    if (!this.ensureReady(width, height)) {
      this.enabled = false;
      this.updateCanvasVisibility();
      this.syncStats();
      return false;
    }

    this.enabled = true;
    this.resetPerformanceGuard();
    this.stats.error = null;
    this.stats.warning = null;
    this.stats.autoDisabled = false;
    this.updateCanvasVisibility();
    this.resize(width, height);
    this.syncStats();
    return true;
  }

  ensureReady(width, height) {
    if (this.ready) return true;
    if (!this.available) return false;

    try {
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        premultipliedAlpha: false
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = this.config.materialBrightness ?? 0.94;
      this.renderer.autoClear = true;
      this.renderer.sortObjects = true;
      this.renderer.domElement.id = "three-overlay";
      this.renderer.domElement.setAttribute("aria-hidden", "true");
      document.body.append(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 4000);
      this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(180, 240, 520);
      this.scene.add(keyLight);

      this.cursorGroup = this.createCursorGroup();
      this.scene.add(this.cursorGroup);
      this.depthField = this.createDepthField(width, height);
      this.scene.add(this.depthField);
      this.createPearlResources();
      this.pearlGroup = new THREE.Group();
      this.scene.add(this.pearlGroup);
      this.createVineResources();
      this.vineGroup = new THREE.Group();
      this.scene.add(this.vineGroup);
      this.createBranchResources();
      this.branchGroup = new THREE.Group();
      this.scene.add(this.branchGroup);
      this.createButterflyResources();
      this.butterflyGroup = new THREE.Group();
      this.scene.add(this.butterflyGroup);

      this.ready = true;
      this.stats.error = null;
      this.resize(width, height);
      return true;
    } catch (error) {
      this.available = false;
      this.ready = false;
      this.enabled = false;
      this.stats.error = error instanceof Error ? error.message : String(error);
      this.cleanupFailedRenderer();
      return false;
    }
  }

  createCursorGroup() {
    const group = new THREE.Group();

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(28, 1.25, 8, 72), ringMaterial);
    group.add(ring);

    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffdbe5,
      emissive: 0xff6b8a,
      emissiveIntensity: 0.2,
      roughness: 0.28,
      metalness: 0,
      transmission: 0,
      transparent: true,
      opacity: 0.86,
      depthWrite: false
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(7.5, 24, 16), coreMaterial);
    core.position.z = 12;
    group.add(core);

    const glintMaterial = new THREE.MeshBasicMaterial({
      color: 0x9ff3df,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    for (let index = 0; index < 3; index += 1) {
      const glint = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 8), glintMaterial.clone());
      glint.position.set(Math.cos(index * 2.1) * 20, Math.sin(index * 2.1) * 16, 24 + index * 10);
      group.add(glint);
    }

    return group;
  }

  createDepthField(width, height) {
    const count = this.config.depthDotCount ?? 42;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      positions[offset] = (Math.random() - 0.5) * width * 0.95;
      positions[offset + 1] = (Math.random() - 0.5) * height * 0.78;
      positions[offset + 2] = -320 + Math.random() * 520;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 4.2,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  createPearlResources() {
    this.pearlGeometry = new THREE.SphereGeometry(1, 32, 20);
    this.pearlHighlightGeometry = new THREE.SphereGeometry(1, 16, 10);
    this.pearlRimGeometry = new THREE.TorusGeometry(1, 0.035, 8, 54);
    this.pearlBodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffedf3,
      emissive: 0x4f2d45,
      emissiveIntensity: 0.05,
      roughness: 0.16,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      reflectivity: 0.72,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    this.pearlHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.pearlRimMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  createVineResources() {
    this.vineStemGeometry = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
    this.vineBudGeometry = new THREE.SphereGeometry(1, 14, 10);

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(9, 7, 9, 20, 0, 30);
    leafShape.bezierCurveTo(-9, 20, -9, 7, 0, 0);
    this.vineLeafGeometry = new THREE.ShapeGeometry(leafShape, 18);
    this.vineLeafGeometry.translate(0, 0, 0);

    this.vineStemMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4ba25d,
      emissive: 0x123c22,
      emissiveIntensity: 0.08,
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.36,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    });
    this.vineLeafMaterial = new THREE.MeshBasicMaterial({
      color: 0x4fa45c,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.vineVeinMaterial = new THREE.MeshBasicMaterial({
      color: 0xd8ffd0,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.vineTendrilMaterial = new THREE.LineBasicMaterial({
      color: 0xb8ef98,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.vineBudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc2da,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    });
  }

  createBranchResources() {
    this.branchStemGeometry = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
    this.branchBudGeometry = new THREE.SphereGeometry(1, 14, 10);
    this.branchCenterGeometry = new THREE.SphereGeometry(1, 16, 10);

    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(0.58, -0.26, 0.62, -1.08, 0, -1.58);
    petalShape.bezierCurveTo(-0.62, -1.08, -0.58, -0.26, 0, 0);
    this.branchPetalGeometry = new THREE.ShapeGeometry(petalShape, 16);

    this.branchStemMaterial = new THREE.MeshBasicMaterial({
      color: 0xd79667,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.branchHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd0a3,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.branchPetalMaterial = new THREE.MeshBasicMaterial({
      color: 0xffb8cb,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.branchPetalAccentMaterial = new THREE.MeshBasicMaterial({
      color: 0xffeef2,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.branchBudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffb4c6,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.branchCenterMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd46e,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  createButterflyResources() {
    const upperWing = new THREE.Shape();
    upperWing.moveTo(0, 0);
    upperWing.bezierCurveTo(8, -13, 24, -12, 31, 0);
    upperWing.bezierCurveTo(24, 17, 9, 19, 0, 0);
    this.butterflyWingGeometry = new THREE.ShapeGeometry(upperWing, 18);

    const lowerWing = new THREE.Shape();
    lowerWing.moveTo(0, 0);
    lowerWing.bezierCurveTo(7, 8, 19, 11, 22, 24);
    lowerWing.bezierCurveTo(10, 28, 2, 17, 0, 0);
    this.butterflyLowerWingGeometry = new THREE.ShapeGeometry(lowerWing, 14);

    this.butterflyBodyGeometry = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
    this.butterflyTrailGeometry = new THREE.SphereGeometry(1, 10, 6);
    this.butterflyAntennaGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 16, 4)
    ]);
    this.butterflyBodyMaterial = new THREE.MeshBasicMaterial({
      color: 0x322a33,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    });
    this.butterflyTrailMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  getQualityProfile() {
    return QUALITY_PROFILES[this.qualityLevel] ?? QUALITY_PROFILES[QUALITY_PROFILES.length - 1];
  }

  getObjectLimit(materialId, fallback) {
    const configured = this.config[`${materialId}MaxCount`] ?? fallback;
    const profile = this.getQualityProfile();
    return Math.max(0, Math.floor(configured * profile.objectScale));
  }

  resetPerformanceGuard() {
    this.qualityLevel = 0;
    this.slowQualitySamples = 0;
    this.lastQualityCheckAt = 0;
    this.performanceWarmupUntil = 0;
  }

  resize(width, height) {
    if (!this.ready || !this.renderer || !this.camera) return;

    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const maxPixelRatio = this.config.maxPixelRatio ?? 1.5;
    const profile = this.getQualityProfile();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio * profile.pixelRatioScale);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(safeWidth, safeHeight, false);
    this.camera.aspect = safeWidth / safeHeight;
    this.camera.position.set(0, 0, this.getCameraDistance(safeHeight));
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    this.stats.width = safeWidth;
    this.stats.height = safeHeight;
    this.stats.pixelRatio = pixelRatio;
  }

  render(state, width, height, now = performance.now(), renderData = {}) {
    if (!this.enabled || !this.ready || !this.renderer || !this.scene || !this.camera) return;

    try {
      this.resize(width, height);
      const frameStart = performance.now();
      this.updateScene(state, width, height, now, renderData);
      this.renderer.render(this.scene, this.camera);
      this.updatePerformanceStats(frameStart, now);
    } catch (error) {
      this.available = false;
      this.enabled = false;
      this.stats.error = error instanceof Error ? error.message : String(error);
      this.updateCanvasVisibility();
    }
  }

  updateScene(state, width, height, now, renderData = {}) {
    const elapsed = now * 0.001;
    const target = state.indexPoint ?? { x: width / 2, y: height / 2 };
    const world = this.screenToWorld(target.x, target.y, state.isPinching ? 42 : 0);

    this.cursorGroup.position.lerp(world, state.handVisible ? 0.34 : 0.08);
    this.cursorGroup.rotation.z += state.isPinching ? 0.034 : 0.012;
    this.cursorGroup.rotation.x = Math.sin(elapsed * 1.2) * 0.18;
    this.cursorGroup.scale.setScalar(state.isPinching ? 1.18 : 0.92);
    this.cursorGroup.visible = true;

    this.depthField.rotation.z = Math.sin(elapsed * 0.18) * 0.035;
    this.depthField.rotation.y = Math.sin(elapsed * 0.23) * 0.06;

    this.syncPearls(renderData.pearlElements ?? [], now);
    this.syncVines(renderData.vineElements ?? [], now);
    this.syncBranches(renderData.branchElements ?? [], now);
    this.syncButterflies(renderData.butterflyElements ?? [], now);
  }

  syncPearls(pearlElements, now) {
    if (!this.pearlGroup) return;

    const maxPearls = this.getObjectLimit("pearl", 220);
    const visiblePearls = pearlElements.slice(-maxPearls);
    const visibleKeys = new Set();

    visiblePearls.forEach((pearl, index) => {
      const key = this.getPearlKey(pearl, index);
      visibleKeys.add(key);

      let entry = this.pearlMeshes.get(key);
      if (!entry) {
        entry = this.createPearlEntry(pearl, index);
        this.pearlMeshes.set(key, entry);
        this.pearlGroup.add(entry.group);
      }

      this.updatePearlEntry(entry, pearl, index, now);
    });

    for (const [key, entry] of this.pearlMeshes) {
      if (visibleKeys.has(key)) continue;
      this.pearlGroup.remove(entry.group);
      this.disposePearlEntry(entry);
      this.pearlMeshes.delete(key);
    }

    this.stats.pearlObjects = this.pearlMeshes.size;
  }

  createPearlEntry(pearl, index) {
    const seed = this.hash01(pearl.elementId ?? index);
    const bodyMaterial = this.pearlBodyMaterial.clone();
    const highlightMaterial = this.pearlHighlightMaterial.clone();
    const rimMaterial = this.pearlRimMaterial.clone();
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x352636,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });

    const group = new THREE.Group();
    const shadow = new THREE.Mesh(this.pearlGeometry, shadowMaterial);
    shadow.position.set(0.18, -0.2, -0.18);
    shadow.scale.set(1.04, 0.82, 0.2);
    group.add(shadow);

    const body = new THREE.Mesh(this.pearlGeometry, bodyMaterial);
    group.add(body);

    const wash = new THREE.Mesh(this.pearlGeometry, highlightMaterial.clone());
    wash.scale.set(0.82, 0.82, 0.82);
    wash.position.set(-0.08, 0.08, 0.14);
    wash.material.opacity = 0.2;
    group.add(wash);

    const highlight = new THREE.Mesh(this.pearlHighlightGeometry, highlightMaterial);
    highlight.position.set(-0.38, 0.42, 0.72);
    group.add(highlight);

    const glint = new THREE.Mesh(this.pearlHighlightGeometry, highlightMaterial.clone());
    glint.position.set(-0.1, 0.58, 0.9);
    group.add(glint);

    const rim = new THREE.Mesh(this.pearlRimGeometry, rimMaterial);
    rim.position.z = 0.03;
    group.add(rim);

    return {
      group,
      body,
      wash,
      highlight,
      glint,
      rim,
      shadow,
      seed,
      target: new THREE.Vector3()
    };
  }

  updatePearlEntry(entry, pearl, index, now) {
    const elapsed = now * 0.001;
    const depthRange = this.config.pearlDepthRange ?? 180;
    const depth = (pearl.depth ?? entry.seed * 2 - 1) * depthRange * 0.5;
    const drift = Math.sin(elapsed * (0.65 + entry.seed * 0.7) + entry.seed * 12.7) * 7.5;
    const world = this.screenToWorld(pearl.x, pearl.y, depth + drift);
    const scale = pearl.radius * (1.18 + entry.seed * 0.42) * (1 + depth / Math.max(1, depthRange) * 0.18);
    const shimmer = pearl.shimmer ?? 1;
    const warm = pearl.warm ?? 0;
    const blush = pearl.blush ?? 0;

    entry.target.copy(world);
    entry.group.position.lerp(entry.target, 0.38);
    entry.group.scale.setScalar(Math.max(4, scale));
    entry.group.rotation.x = Math.sin(elapsed * 0.52 + entry.seed * 9.1) * 0.16;
    entry.group.rotation.y = Math.cos(elapsed * 0.43 + entry.seed * 8.4) * 0.2;
    entry.group.rotation.z = pearl.angle ?? 0;
    entry.group.renderOrder = 4 + index * 0.001;

    entry.body.material.color.setRGB(
      (248 + warm * 0.34) / 255,
      (236 + warm * 0.52 + blush * 7) / 255,
      (240 + warm * 0.42 + blush * 10) / 255
    );
    entry.body.material.opacity = Math.min(0.96, (pearl.alpha ?? 230) / 255 + 0.04);
    entry.body.material.emissiveIntensity = 0.035 + shimmer * 0.018;

    entry.wash.material.opacity = 0.14 + shimmer * 0.055;
    entry.highlight.scale.setScalar(0.18 + (pearl.highlightScale ?? 0.52) * 0.26);
    entry.highlight.material.opacity = 0.58 + shimmer * 0.11;
    entry.glint.scale.setScalar(0.07 + shimmer * 0.055);
    entry.glint.material.opacity = 0.55 + Math.sin(elapsed * 2.2 + entry.seed * 20) * 0.16;
    entry.rim.scale.setScalar((pearl.rim ?? 1) * 1.02);
    entry.rim.material.opacity = 0.13 + shimmer * 0.07;
    entry.shadow.material.opacity = 0.075 + Math.max(0, -depth / Math.max(1, depthRange)) * 0.09;
  }

  disposePearlEntry(entry) {
    [
      entry.body,
      entry.wash,
      entry.highlight,
      entry.glint,
      entry.rim,
      entry.shadow
    ].forEach((mesh) => {
      if (mesh?.material && mesh.material !== this.pearlBodyMaterial) {
        mesh.material.dispose?.();
      }
    });
  }

  getPearlKey(pearl, fallbackIndex) {
    if (pearl.elementId != null) return `pearl-${pearl.elementId}`;
    return `pearl-${pearl.strokeId ?? "x"}-${fallbackIndex}-${Math.round(pearl.x)}-${Math.round(pearl.y)}`;
  }

  hash01(value) {
    const stringValue = String(value);
    let hash = 2166136261;
    for (let index = 0; index < stringValue.length; index += 1) {
      hash ^= stringValue.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 10000) / 10000;
  }

  syncVines(vineElements, now) {
    if (!this.vineGroup) return;

    const maxVines = this.getObjectLimit("vine", 110);
    const visibleVines = vineElements.slice(-maxVines);
    const visibleKeys = new Set();

    visibleVines.forEach((node, index) => {
      const key = this.getVineKey(node, index);
      visibleKeys.add(key);

      let entry = this.vineMeshes.get(key);
      if (!entry) {
        entry = this.createVineEntry(node, index, now);
        this.vineMeshes.set(key, entry);
        this.vineGroup.add(entry.group);
      }

      this.updateVineEntry(entry, node, index, now);
    });

    for (const [key, entry] of this.vineMeshes) {
      if (visibleKeys.has(key)) continue;
      this.vineGroup.remove(entry.group);
      this.disposeVineEntry(entry);
      this.vineMeshes.delete(key);
    }

    this.stats.vineObjects = this.vineMeshes.size;
  }

  createVineEntry(node, index, now) {
    const seed = this.hash01(node.elementId ?? `vine-${index}`);
    const group = new THREE.Group();
    const stemMaterial = this.vineStemMaterial.clone();
    const leafMaterial = this.vineLeafMaterial.clone();
    const veinMaterial = this.vineVeinMaterial.clone();
    const tendrilMaterial = this.vineTendrilMaterial.clone();
    const budMaterial = this.vineBudMaterial.clone();
    const stems = [];

    for (let stemIndex = 0; stemIndex < 3; stemIndex += 1) {
      const stem = new THREE.Mesh(this.vineStemGeometry, stemMaterial);
      stem.renderOrder = 2 + stemIndex * 0.01;
      group.add(stem);
      stems.push(stem);
    }

    const leafGroup = new THREE.Group();
    const leaf = new THREE.Mesh(this.vineLeafGeometry, leafMaterial);
    leafGroup.add(leaf);
    const vein = new THREE.Mesh(this.vineStemGeometry, veinMaterial);
    vein.position.set(0, 14, 0.65);
    vein.scale.set(0.18, 24, 0.18);
    leafGroup.add(vein);
    group.add(leafGroup);

    const tendril = new THREE.Line(this.createTendrilGeometry(node), tendrilMaterial);
    group.add(tendril);

    const budGroup = new THREE.Group();
    const budStem = new THREE.Mesh(this.vineStemGeometry, stemMaterial.clone());
    budStem.position.set(0, 6, 0);
    budStem.scale.set(0.28, 11, 0.28);
    budGroup.add(budStem);
    const bud = new THREE.Mesh(this.vineBudGeometry, budMaterial);
    bud.position.set(0, 13, 0.8);
    bud.scale.setScalar(2.6);
    budGroup.add(bud);
    group.add(budGroup);

    return {
      group,
      stems,
      leafGroup,
      leaf,
      vein,
      tendril,
      budGroup,
      bud,
      budStem,
      seed,
      bornAt: now,
      materials: [stemMaterial, leafMaterial, veinMaterial, tendrilMaterial, budMaterial, budStem.material]
    };
  }

  createTendrilGeometry(node) {
    const points = [];
    const curl = node.tendrilCurl ?? 1;
    for (let index = 0; index < 24; index += 1) {
      const t = index / 23;
      const wave = Math.sin(t * Math.PI * 5.6 * curl) * (1 - t) * 4.2;
      points.push(new THREE.Vector3(t * 34, wave, Math.sin(t * Math.PI * 3.2) * 4.8));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }

  updateVineEntry(entry, node, index, now) {
    const growthMs = this.config.vineGrowthMs ?? 780;
    const grow = THREE.MathUtils.clamp((now - entry.bornAt) / growthMs, 0, 1);
    const depthRange = this.config.vineDepthRange ?? 150;
    const depth = (entry.seed * 2 - 1) * depthRange * 0.5;
    const drift = Math.sin(now * 0.001 * (0.34 + entry.seed * 0.32) + entry.seed * 9.7) * 8;
    const from = node.from ?? {
      x: node.x - Math.cos(node.angle ?? 0) * 20,
      y: node.y - Math.sin(node.angle ?? 0) * 20
    };
    const midScreen = {
      x: (from.x + node.x) * 0.5 + Math.cos((node.angle ?? 0) + Math.PI / 2) * (10 + entry.seed * 14),
      y: (from.y + node.y) * 0.5 + Math.sin((node.angle ?? 0) + Math.PI / 2) * (10 + entry.seed * 14)
    };

    const start = this.screenToWorld(from.x, from.y, depth);
    const control = this.screenToWorld(midScreen.x, midScreen.y, depth + drift * 0.72);
    const end = this.screenToWorld(node.x, node.y, depth + drift);
    const curvePoints = [0, 0.36, 0.72, 1].map((t) => this.quadraticPoint(start, control, end, t));
    const radius = Math.max(1.6, (node.stemWidth ?? 4) * (0.74 + entry.seed * 0.18));

    entry.stems.forEach((stem, stemIndex) => {
      const pieceGrow = THREE.MathUtils.clamp(grow * entry.stems.length - stemIndex, 0, 1);
      const a = curvePoints[stemIndex];
      const b = curvePoints[stemIndex + 1];
      const partialEnd = a.clone().lerp(b, pieceGrow);
      stem.visible = pieceGrow > 0.02;
      stem.material.opacity = (0.36 + pieceGrow * 0.42) * (0.86 + entry.seed * 0.12);
      this.setCylinderBetween(stem, a, partialEnd, radius * (0.92 - stemIndex * 0.08));
    });

    const leafGrow = THREE.MathUtils.clamp((grow - 0.36) / 0.5, 0, 1);
    const leafScale = (node.leafScale ?? 1) * (0.62 + entry.seed * 0.16) * leafGrow;
    const leafAngle = -(node.angle ?? 0) + (node.leafSide ?? 1) * 0.98 + (node.leafTwist ?? 0);
    entry.leafGroup.visible = leafGrow > 0.02;
    entry.leafGroup.position.copy(end);
    entry.leafGroup.position.z += 3 + entry.seed * 14;
    entry.leafGroup.rotation.set(Math.sin(entry.seed * 6) * 0.24, Math.cos(entry.seed * 7) * 0.18, leafAngle);
    entry.leafGroup.scale.set((node.leafSide ?? 1) * leafScale, leafScale, leafScale);
    entry.leaf.material.opacity = 0.44 + leafGrow * 0.32;
    entry.vein.material.opacity = 0.12 + leafGrow * 0.24;

    const tendrilGrow = node.hasTendril ? THREE.MathUtils.clamp((grow - 0.48) / 0.44, 0, 1) : 0;
    entry.tendril.visible = tendrilGrow > 0.02;
    entry.tendril.position.copy(end);
    entry.tendril.position.z += 6 + entry.seed * 9;
    entry.tendril.rotation.set(0, Math.sin(entry.seed * 5) * 0.16, -(node.angle ?? 0) - (node.leafSide ?? 1) * 0.9);
    entry.tendril.scale.setScalar((node.leafScale ?? 1) * tendrilGrow);
    entry.tendril.material.opacity = 0.2 + tendrilGrow * 0.34;

    const budGrow = node.hasBud ? THREE.MathUtils.clamp((grow - 0.56) / 0.38, 0, 1) : 0;
    entry.budGroup.visible = budGrow > 0.02;
    entry.budGroup.position.copy(end);
    entry.budGroup.position.z += 8 + entry.seed * 10;
    entry.budGroup.rotation.set(0, 0, -(node.angle ?? 0) + (node.leafSide ?? 1) * 1.28);
    entry.budGroup.scale.setScalar((node.leafScale ?? 1) * budGrow);
    if (Array.isArray(node.budColor)) {
      entry.bud.material.color.setRGB(node.budColor[0] / 255, node.budColor[1] / 255, node.budColor[2] / 255);
    }
    entry.bud.material.opacity = 0.36 + budGrow * 0.48;
    entry.group.renderOrder = 2 + index * 0.001;
  }

  disposeVineEntry(entry) {
    entry.tendril?.geometry?.dispose?.();
    entry.materials?.forEach((material) => material?.dispose?.());
  }

  getVineKey(node, fallbackIndex) {
    if (node.elementId != null) return `vine-${node.elementId}`;
    return `vine-${node.strokeId ?? "x"}-${fallbackIndex}-${Math.round(node.x)}-${Math.round(node.y)}`;
  }

  syncBranches(branchElements, now) {
    if (!this.branchGroup) return;

    const maxBranches = this.getObjectLimit("branch", 120);
    const visibleBranches = branchElements.slice(-maxBranches);
    const visibleKeys = new Set();

    visibleBranches.forEach((branch, index) => {
      const key = this.getBranchKey(branch, index);
      visibleKeys.add(key);

      let entry = this.branchMeshes.get(key);
      if (!entry) {
        entry = this.createBranchEntry(branch, index, now);
        this.branchMeshes.set(key, entry);
        this.branchGroup.add(entry.group);
      }

      this.updateBranchEntry(entry, branch, index, now);
    });

    for (const [key, entry] of this.branchMeshes) {
      if (visibleKeys.has(key)) continue;
      this.branchGroup.remove(entry.group);
      this.disposeBranchEntry(entry);
      this.branchMeshes.delete(key);
    }

    this.stats.branchObjects = this.branchMeshes.size;
  }

  createBranchEntry(branch, index, now) {
    const seed = this.hash01(branch.elementId ?? `branch-${index}`);
    const group = new THREE.Group();

    const trunkMaterial = this.branchStemMaterial.clone();
    const trunkHighlightMaterial = this.branchHighlightMaterial.clone();
    const sideMaterial = this.branchStemMaterial.clone();
    const sideHighlightMaterial = this.branchHighlightMaterial.clone();
    const twigMaterial = this.branchStemMaterial.clone();
    const twigHighlightMaterial = this.branchHighlightMaterial.clone();
    const budStemMaterial = this.branchHighlightMaterial.clone();
    const budMaterial = this.branchBudMaterial.clone();
    const centerMaterial = this.branchCenterMaterial.clone();
    const glintMaterial = this.branchPetalAccentMaterial.clone();

    if (Array.isArray(branch.budTone)) {
      budMaterial.color.setRGB(branch.budTone[0] / 255, branch.budTone[1] / 255, branch.budTone[2] / 255);
    }

    const trunk = new THREE.Mesh(this.branchStemGeometry, trunkMaterial);
    const trunkHighlight = new THREE.Mesh(this.branchStemGeometry, trunkHighlightMaterial);
    const side = new THREE.Mesh(this.branchStemGeometry, sideMaterial);
    const sideHighlight = new THREE.Mesh(this.branchStemGeometry, sideHighlightMaterial);
    const twig = new THREE.Mesh(this.branchStemGeometry, twigMaterial);
    const twigHighlight = new THREE.Mesh(this.branchStemGeometry, twigHighlightMaterial);
    group.add(trunk, trunkHighlight, side, sideHighlight, twig, twigHighlight);

    const budGroup = new THREE.Group();
    const buds = [];
    for (let budIndex = 0; budIndex < 3; budIndex += 1) {
      const root = new THREE.Group();
      const stem = new THREE.Mesh(this.branchStemGeometry, budStemMaterial.clone());
      const bud = new THREE.Mesh(this.branchBudGeometry, budMaterial.clone());
      root.add(stem, bud);
      budGroup.add(root);
      buds.push({ root, stem, bud });
    }
    group.add(budGroup);

    const blossomGroup = new THREE.Group();
    const petals = [];
    for (let petalIndex = 0; petalIndex < 6; petalIndex += 1) {
      const petalMaterial = this.branchPetalMaterial.clone();
      const accentMaterial = this.branchPetalAccentMaterial.clone();
      const petal = new THREE.Mesh(this.branchPetalGeometry, petalMaterial);
      const accent = new THREE.Mesh(this.branchPetalGeometry, accentMaterial);
      accent.scale.set(0.46, 0.52, 1);
      accent.position.z = 0.18;
      petal.add(accent);
      blossomGroup.add(petal);
      petals.push({ petal, accent });
    }

    const center = new THREE.Mesh(this.branchCenterGeometry, centerMaterial);
    const glint = new THREE.Mesh(this.branchCenterGeometry, glintMaterial);
    blossomGroup.add(center, glint);
    group.add(blossomGroup);

    return {
      group,
      trunk,
      trunkHighlight,
      side,
      sideHighlight,
      twig,
      twigHighlight,
      budGroup,
      buds,
      blossomGroup,
      petals,
      center,
      glint,
      seed,
      bornAt: now,
      target: new THREE.Vector3(),
      materials: [
        trunkMaterial,
        trunkHighlightMaterial,
        sideMaterial,
        sideHighlightMaterial,
        twigMaterial,
        twigHighlightMaterial,
        budStemMaterial,
        budMaterial,
        centerMaterial,
        glintMaterial,
        ...buds.flatMap((item) => [item.stem.material, item.bud.material]),
        ...petals.flatMap((item) => [item.petal.material, item.accent.material])
      ]
    };
  }

  updateBranchEntry(entry, branch, index, now) {
    const growthMs = this.config.branchGrowthMs ?? 920;
    const grow = THREE.MathUtils.clamp((now - entry.bornAt) / growthMs, 0, 1);
    const depthRange = this.config.branchDepthRange ?? 180;
    const elapsed = now * 0.001;
    const baseAngle = branch.angle ?? 0;
    const sideAngle = branch.branchAngle ?? baseAngle + (branch.side ?? 1) * 0.82;
    const twigAngle = sideAngle + (branch.twigSide ?? 1) * (branch.twigAngleOffset ?? 0.82);
    const depth = (entry.seed * 2 - 1) * depthRange * 0.42;
    const sway = Math.sin(elapsed * (0.32 + entry.seed * 0.22) + entry.seed * 7.8) * 7.5;
    const from = branch.from ?? {
      x: branch.x - Math.cos(baseAngle) * 26,
      y: branch.y - Math.sin(baseAngle) * 26
    };
    const sideEndScreen = {
      x: branch.x + Math.cos(sideAngle) * (branch.branchLength ?? 28),
      y: branch.y + Math.sin(sideAngle) * (branch.branchLength ?? 28)
    };
    const twigStartScreen = {
      x: branch.x + Math.cos(sideAngle) * (branch.branchLength ?? 28) * 0.58,
      y: branch.y + Math.sin(sideAngle) * (branch.branchLength ?? 28) * 0.58
    };
    const twigEndScreen = {
      x: twigStartScreen.x + Math.cos(twigAngle) * (branch.twigLength ?? 16),
      y: twigStartScreen.y + Math.sin(twigAngle) * (branch.twigLength ?? 16)
    };
    const blossomScreen = {
      x: sideEndScreen.x + (branch.blossomOffsetX ?? 0),
      y: sideEndScreen.y - (branch.blossomOffsetY ?? 0)
    };

    const start = this.screenToWorld(from.x, from.y, depth - 10 + sway * 0.3);
    const anchor = this.screenToWorld(branch.x, branch.y, depth + sway);
    const sideEnd = this.screenToWorld(
      sideEndScreen.x,
      sideEndScreen.y,
      depth + sway + (branch.side ?? 1) * 18 + entry.seed * 18
    );
    const twigStart = this.screenToWorld(
      twigStartScreen.x,
      twigStartScreen.y,
      depth + sway + (branch.side ?? 1) * 10 + entry.seed * 12
    );
    const twigEnd = this.screenToWorld(
      twigEndScreen.x,
      twigEndScreen.y,
      depth + sway + (branch.side ?? 1) * 28 + entry.seed * 24
    );
    const blossomWorld = this.screenToWorld(
      blossomScreen.x,
      blossomScreen.y,
      depth + sway + (branch.side ?? 1) * 36 + entry.seed * 30
    );

    const mainGrow = this.easeOutCubic(THREE.MathUtils.clamp(grow / 0.34, 0, 1));
    const sideGrow = this.easeOutCubic(THREE.MathUtils.clamp((grow - 0.16) / 0.42, 0, 1));
    const twigGrow = this.easeOutCubic(THREE.MathUtils.clamp((grow - 0.36) / 0.32, 0, 1));
    const budGrow = this.easeOutCubic(THREE.MathUtils.clamp((grow - 0.52) / 0.36, 0, 1));
    const blossomGrow = this.easeOutCubic(THREE.MathUtils.clamp((grow - 0.58) / 0.38, 0, 1));
    const trunkRadius = Math.max(1.4, (branch.trunkWidth ?? 4.4) * (0.78 + entry.seed * 0.12));

    this.updateBranchCylinder(entry.trunk, start, anchor, mainGrow, trunkRadius, 0.36 + mainGrow * 0.3);
    this.updateBranchCylinder(entry.trunkHighlight, start, anchor, mainGrow, trunkRadius * 0.42, 0.14 + mainGrow * 0.22);
    this.updateBranchCylinder(entry.side, anchor, sideEnd, sideGrow, trunkRadius * 0.62, 0.32 + sideGrow * 0.34);
    this.updateBranchCylinder(entry.sideHighlight, anchor, sideEnd, sideGrow, trunkRadius * 0.26, 0.12 + sideGrow * 0.22);
    this.updateBranchCylinder(entry.twig, twigStart, twigEnd, twigGrow, trunkRadius * 0.34, 0.26 + twigGrow * 0.28);
    this.updateBranchCylinder(entry.twigHighlight, twigStart, twigEnd, twigGrow, trunkRadius * 0.16, 0.1 + twigGrow * 0.2);

    entry.budGroup.visible = budGrow > 0.02;
    entry.budGroup.position.copy(twigEnd);
    entry.budGroup.rotation.set(
      Math.sin(entry.seed * 5.1) * 0.18,
      Math.cos(entry.seed * 6.3) * 0.18,
      -twigAngle - Math.PI / 2
    );

    const budCount = Math.min(3, Math.max(1, branch.budCount ?? 2));
    entry.buds.forEach((budItem, budIndex) => {
      const budStep = THREE.MathUtils.clamp(budGrow * 3 - budIndex * 0.62, 0, 1);
      const budOpen = this.easeOutCubic(budStep);
      const offset = (budIndex - (budCount - 1) / 2) * 4.6;
      budItem.root.visible = budIndex < budCount && budOpen > 0.02;
      budItem.root.position.set(offset, budIndex * 1.15, budIndex * 1.7);
      budItem.root.rotation.z = (budIndex - 1) * 0.28;
      budItem.stem.visible = budOpen > 0.02;
      budItem.stem.position.y = 3.1 * budOpen;
      budItem.stem.scale.set(0.22, 6.2 * budOpen, 0.22);
      budItem.stem.material.opacity = 0.12 + budOpen * 0.24;
      budItem.bud.position.y = 7.6 * budOpen;
      budItem.bud.scale.setScalar((2.2 + budIndex * 0.34) * budOpen);
      budItem.bud.material.opacity = 0.24 + budOpen * 0.56;
    });

    const petalCount = Math.min(6, Math.max(4, Math.round(branch.blossomPetals ?? 5)));
    const blossomScale = (branch.blossomSize ?? 7) * (0.82 + entry.seed * 0.12) * blossomGrow;
    const blossomPulse = Math.sin(elapsed * 1.4 + entry.seed * 12.3) * 0.05;
    entry.blossomGroup.visible = blossomGrow > 0.02;
    entry.blossomGroup.position.copy(blossomWorld);
    entry.blossomGroup.rotation.set(
      Math.sin(elapsed * 0.38 + entry.seed * 5) * 0.18,
      Math.cos(elapsed * 0.33 + entry.seed * 6) * 0.22,
      -sideAngle + blossomPulse
    );
    entry.blossomGroup.scale.setScalar(Math.max(0.001, blossomScale));

    entry.petals.forEach((petalItem, petalIndex) => {
      const visible = petalIndex < petalCount && blossomGrow > 0.02;
      const petalAngle = (Math.PI * 2 * petalIndex) / petalCount;
      petalItem.petal.visible = visible;
      petalItem.petal.rotation.set(
        Math.sin(petalAngle + entry.seed * 6) * 0.12,
        Math.cos(petalAngle + entry.seed * 7) * 0.1,
        petalAngle + blossomPulse
      );
      petalItem.petal.position.z = Math.sin(petalAngle + entry.seed) * 0.18;
      petalItem.petal.material.opacity = 0.34 + blossomGrow * 0.42;
      petalItem.accent.material.opacity = 0.12 + blossomGrow * 0.24;
    });

    entry.center.visible = blossomGrow > 0.08;
    entry.center.scale.setScalar(0.28 + blossomGrow * 0.16);
    entry.center.position.z = 0.35;
    entry.center.material.opacity = 0.36 + blossomGrow * 0.42;
    entry.glint.visible = blossomGrow > 0.2;
    entry.glint.scale.setScalar(0.08 + Math.abs(Math.sin(elapsed * 1.9 + entry.seed * 13)) * 0.05);
    entry.glint.position.set(-0.16, -0.14, 0.75);
    entry.glint.material.opacity = 0.28 + blossomGrow * 0.3;

    entry.group.renderOrder = 5 + index * 0.001;
  }

  updateBranchCylinder(mesh, start, end, grow, radius, opacity) {
    mesh.visible = grow > 0.015;
    mesh.material.opacity = opacity;
    if (!mesh.visible) return;

    const partialEnd = start.clone().lerp(end, grow);
    this.setCylinderBetween(mesh, start, partialEnd, radius);
  }

  disposeBranchEntry(entry) {
    const materials = new Set(entry.materials ?? []);
    materials.forEach((material) => material?.dispose?.());
  }

  getBranchKey(branch, fallbackIndex) {
    if (branch.elementId != null) return `branch-${branch.elementId}`;
    return `branch-${branch.strokeId ?? "x"}-${fallbackIndex}-${Math.round(branch.x)}-${Math.round(branch.y)}`;
  }

  easeOutCubic(value) {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    return 1 - (1 - t) ** 3;
  }

  quadraticPoint(a, b, c, t) {
    const oneMinusT = 1 - t;
    return new THREE.Vector3(
      oneMinusT * oneMinusT * a.x + 2 * oneMinusT * t * b.x + t * t * c.x,
      oneMinusT * oneMinusT * a.y + 2 * oneMinusT * t * b.y + t * t * c.y,
      oneMinusT * oneMinusT * a.z + 2 * oneMinusT * t * b.z + t * t * c.z
    );
  }

  setCylinderBetween(mesh, start, end, radius) {
    const direction = end.clone().sub(start);
    const length = direction.length();
    if (length < 0.001) {
      mesh.visible = false;
      return;
    }

    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.scale.set(radius, length, radius);
  }

  syncButterflies(butterflyElements, now) {
    if (!this.butterflyGroup) return;

    const maxButterflies = this.getObjectLimit("butterfly", 90);
    const visibleButterflies = butterflyElements.slice(-maxButterflies);
    const visibleKeys = new Set();

    visibleButterflies.forEach((butterfly, index) => {
      const key = this.getButterflyKey(butterfly, index);
      visibleKeys.add(key);

      let entry = this.butterflyMeshes.get(key);
      if (!entry) {
        entry = this.createButterflyEntry(butterfly, index, now);
        this.butterflyMeshes.set(key, entry);
        this.butterflyGroup.add(entry.group);
      }

      this.updateButterflyEntry(entry, butterfly, index, now);
    });

    for (const [key, entry] of this.butterflyMeshes) {
      if (visibleKeys.has(key)) continue;
      this.butterflyGroup.remove(entry.group);
      this.disposeButterflyEntry(entry);
      this.butterflyMeshes.delete(key);
    }

    this.stats.butterflyObjects = this.butterflyMeshes.size;
  }

  createButterflyEntry(butterfly, index, now) {
    const seed = this.hash01(butterfly.elementId ?? `butterfly-${index}`);
    const color = new THREE.Color(
      (butterfly.color?.[0] ?? 244) / 255,
      (butterfly.color?.[1] ?? 144) / 255,
      (butterfly.color?.[2] ?? 170) / 255
    );
    const accent = new THREE.Color(
      (butterfly.accent?.[0] ?? 255) / 255,
      (butterfly.accent?.[1] ?? 190) / 255,
      (butterfly.accent?.[2] ?? 210) / 255
    );
    const wingMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const accentMaterial = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const bodyMaterial = this.butterflyBodyMaterial.clone();
    const antennaMaterial = new THREE.LineBasicMaterial({
      color: 0x3a3139,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    });
    const trailMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const group = new THREE.Group();
    const leftWing = this.createButterflyWingGroup(-1, wingMaterial, accentMaterial);
    const rightWing = this.createButterflyWingGroup(1, wingMaterial.clone(), accentMaterial.clone());
    group.add(leftWing, rightWing);

    const body = new THREE.Mesh(this.butterflyBodyGeometry, bodyMaterial);
    body.scale.set(2.3, 16, 2.3);
    group.add(body);

    const leftAntenna = new THREE.Line(this.butterflyAntennaGeometry, antennaMaterial);
    leftAntenna.position.set(-1.2, 8, 0.6);
    leftAntenna.rotation.z = 0.34;
    const rightAntenna = new THREE.Line(this.butterflyAntennaGeometry, antennaMaterial.clone());
    rightAntenna.position.set(1.2, 8, 0.6);
    rightAntenna.rotation.z = -0.34;
    group.add(leftAntenna, rightAntenna);

    const trails = [];
    for (let trailIndex = 0; trailIndex < 4; trailIndex += 1) {
      const trail = new THREE.Mesh(this.butterflyTrailGeometry, trailMaterial.clone());
      group.add(trail);
      trails.push(trail);
    }

    return {
      group,
      leftWing,
      rightWing,
      body,
      leftAntenna,
      rightAntenna,
      trails,
      seed,
      bornAt: now,
      target: new THREE.Vector3(),
      materials: [
        wingMaterial,
        accentMaterial,
        rightWing.userData.wingMaterial,
        rightWing.userData.accentMaterial,
        bodyMaterial,
        antennaMaterial,
        rightAntenna.material,
        ...trails.map((trail) => trail.material)
      ]
    };
  }

  createButterflyWingGroup(side, wingMaterial, accentMaterial) {
    const pivot = new THREE.Group();
    pivot.userData.wingMaterial = wingMaterial;
    pivot.userData.accentMaterial = accentMaterial;

    const upper = new THREE.Mesh(this.butterflyWingGeometry, wingMaterial);
    upper.scale.x = side;
    upper.position.set(0, 0, 0);
    pivot.add(upper);

    const lower = new THREE.Mesh(this.butterflyLowerWingGeometry, wingMaterial);
    lower.scale.x = side * 0.86;
    lower.scale.y = 0.9;
    lower.position.set(0, -1, -0.4);
    pivot.add(lower);

    const accent = new THREE.Mesh(this.butterflyWingGeometry, accentMaterial);
    accent.scale.set(side * 0.42, 0.46, 1);
    accent.position.set(side * 8.4, 2.5, 0.8);
    pivot.add(accent);

    return pivot;
  }

  updateButterflyEntry(entry, butterfly, index, now) {
    const elapsed = now * 0.001;
    const phase = butterfly.phase ?? entry.seed * Math.PI * 2;
    const driftSpeed = butterfly.drift ?? 0.8;
    const t = elapsed * (0.95 + driftSpeed * 0.62) + phase;
    const depthRange = this.config.butterflyDepthRange ?? 240;
    const flySpread = this.config.butterflyFlySpread ?? 46;
    const angle = butterfly.angle ?? 0;
    const orbit = (butterfly.orbit ?? 14) * (1.25 + entry.seed * 0.6);
    const lift = (butterfly.lift ?? 12) * (1.1 + entry.seed * 0.45);
    const scatter = Math.min(1, (now - entry.bornAt) / (this.config.butterflyScatterMs ?? 1800));
    const sideX = Math.sin(t * 0.74) * orbit + Math.sin(t * 0.31 + entry.seed * 8) * flySpread * scatter;
    const floatY = Math.sin(t * 1.12) * lift - scatter * (12 + entry.seed * 22);
    const forward = scatter * (18 + entry.seed * 48);
    const screenX =
      (butterfly.anchorX ?? butterfly.x) +
      Math.cos(angle + Math.PI / 2) * sideX +
      Math.cos(angle) * forward;
    const screenY =
      (butterfly.anchorY ?? butterfly.y) +
      floatY +
      Math.sin(angle) * forward * 0.42;
    const depth =
      (entry.seed * 2 - 1) * depthRange * 0.5 +
      Math.sin(t * 0.46) * 34 +
      scatter * 36;
    const world = this.screenToWorld(screenX, screenY, depth);
    const scale = (butterfly.scale ?? 1) * (0.7 + entry.seed * 0.28);
    const flap = Math.sin(t * 5.8) * 0.85;
    const flapOpen = 0.38 + Math.abs(Math.sin(t * 5.8)) * 0.42;

    entry.target.copy(world);
    entry.group.position.lerp(entry.target, 0.26);
    entry.group.rotation.x = Math.sin(t * 0.54) * 0.26;
    entry.group.rotation.y = Math.cos(t * 0.42 + entry.seed * 4) * 0.32;
    entry.group.rotation.z = -angle - Math.PI / 2 + Math.sin(t * 0.62) * 0.18;
    entry.group.scale.setScalar(0.72 * scale);
    entry.group.renderOrder = 7 + index * 0.001;

    entry.leftWing.rotation.y = flapOpen + flap * 0.36;
    entry.rightWing.rotation.y = -flapOpen + flap * 0.36;
    entry.leftWing.rotation.z = -0.16;
    entry.rightWing.rotation.z = 0.16;

    entry.body.material.opacity = 0.58 + Math.abs(flap) * 0.18;
    entry.leftAntenna.material.opacity = 0.34 + Math.abs(flap) * 0.12;
    entry.rightAntenna.material.opacity = entry.leftAntenna.material.opacity;

    entry.trails.forEach((trail, trailIndex) => {
      const delay = trailIndex + 1;
      trail.position.set(
        Math.sin(t - delay) * 3,
        -delay * 12 + Math.cos(t - delay) * 3,
        -delay * 8
      );
      trail.scale.setScalar(Math.max(1.1, (4.4 - trailIndex * 0.75) * scale));
      trail.material.opacity = Math.max(0.02, 0.18 - trailIndex * 0.035);
    });
  }

  disposeButterflyEntry(entry) {
    entry.materials?.forEach((material) => material?.dispose?.());
  }

  getButterflyKey(butterfly, fallbackIndex) {
    if (butterfly.elementId != null) return `butterfly-${butterfly.elementId}`;
    return `butterfly-${butterfly.strokeId ?? "x"}-${fallbackIndex}-${Math.round(butterfly.x)}-${Math.round(butterfly.y)}`;
  }

  screenToWorld(x, y, z = 0) {
    const ndc = new THREE.Vector3(
      (x / Math.max(this.stats.width, 1)) * 2 - 1,
      -(y / Math.max(this.stats.height, 1)) * 2 + 1,
      0.5
    );
    ndc.unproject(this.camera);
    const direction = ndc.sub(this.camera.position).normalize();
    const distance = (z - this.camera.position.z) / direction.z;
    return this.camera.position.clone().add(direction.multiplyScalar(distance));
  }

  updatePerformanceStats(frameStart, now) {
    const frameEnd = performance.now();
    this.frameCount += 1;
    this.stats.frameTimeMs = frameEnd - frameStart;

    if (!this.lastStatsAt) {
      this.lastStatsAt = now;
      this.frameCount = 0;
    } else if (now - this.lastStatsAt >= 500) {
      this.stats.fps = Math.round((this.frameCount * 1000) / (now - this.lastStatsAt));
      this.lastStatsAt = now;
      this.frameCount = 0;
      this.evaluatePerformance(now);
    }

    this.syncStats();
  }

  evaluatePerformance(now) {
    if (!this.enabled || !this.ready || this.config.autoQuality === false) return;
    if (!this.performanceWarmupUntil) {
      this.performanceWarmupUntil = now + (this.config.qualityWarmupMs ?? 3200);
      return;
    }
    if (now < this.performanceWarmupUntil) return;

    const sampleMs = this.config.qualitySampleMs ?? 1600;
    if (now - this.lastQualityCheckAt < sampleMs) return;
    this.lastQualityCheckAt = now;

    const fps = this.stats.fps;
    const frameTime = this.stats.frameTimeMs;
    const isSlow =
      (fps > 0 && fps < (this.config.qualityDropFps ?? 42)) ||
      frameTime > (this.config.qualityDropFrameMs ?? 24);

    if (!isSlow) {
      this.slowQualitySamples = Math.max(0, this.slowQualitySamples - 1);
      return;
    }

    this.slowQualitySamples += 1;
    if (this.slowQualitySamples < 2) return;

    const lastQualityLevel = QUALITY_PROFILES.length - 1;
    if (this.qualityLevel < lastQualityLevel) {
      this.qualityLevel += 1;
      this.slowQualitySamples = 0;
      this.stats.warning = `3D 已自动降级到${this.getQualityProfile().label}档`;
      this.resize(this.stats.width, this.stats.height);
      return;
    }

    const shouldDisable =
      (fps > 0 && fps < (this.config.qualityDisableFps ?? 24)) ||
      frameTime > (this.config.qualityDisableFrameMs ?? 44);

    if (!shouldDisable) return;

    this.enabled = false;
    this.stats.autoDisabled = true;
    this.stats.error = "3D 性能过低，已自动关闭";
    this.updateCanvasVisibility();
  }

  syncStats() {
    const renderInfo = this.renderer?.info?.render;
    const profile = this.getQualityProfile();
    this.stats.enabled = this.enabled;
    this.stats.available = this.available;
    this.stats.ready = this.ready;
    this.stats.qualityLevel = this.qualityLevel;
    this.stats.qualityLabel = profile.label;
    this.stats.qualityScale = profile.objectScale;
    this.stats.renderCalls = renderInfo?.calls ?? 0;
    this.stats.triangles = renderInfo?.triangles ?? 0;
    this.stats.points = renderInfo?.points ?? 0;
    this.stats.pearlObjects = this.pearlMeshes.size;
    this.stats.vineObjects = this.vineMeshes.size;
    this.stats.branchObjects = this.branchMeshes.size;
    this.stats.butterflyObjects = this.butterflyMeshes.size;
  }

  updateCanvasVisibility() {
    const canvas = this.renderer?.domElement;
    if (!canvas) return;

    canvas.classList.toggle("is-visible", this.enabled);
    canvas.style.opacity = this.enabled
      ? String(THREE.MathUtils.clamp(this.config.materialOpacityScale ?? 0.9, 0.5, 1))
      : "";
  }

  cleanupFailedRenderer() {
    this.renderer?.domElement?.remove?.();
    this.renderer?.dispose?.();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.cursorGroup = null;
    this.depthField = null;
    this.pearlGroup = null;
    this.pearlMeshes.clear();
    this.vineGroup = null;
    this.vineMeshes.clear();
    this.branchGroup = null;
    this.branchMeshes.clear();
    this.butterflyGroup = null;
    this.butterflyMeshes.clear();
  }

  getCameraDistance(height) {
    return height / 2 / Math.tan(THREE.MathUtils.degToRad(45 / 2));
  }

  getStats() {
    this.syncStats();
    return { ...this.stats };
  }
}
