export const MATERIALS = [
  { id: "pearl", label: "珍珠" },
  { id: "flower", label: "小花" },
  { id: "grass", label: "小草" },
  { id: "vine", label: "藤蔓" },
  { id: "branch", label: "花枝" },
  { id: "butterfly", label: "蝴蝶" }
];

export const APP_VERSION = "mvp-three-showcase-20260620-2315";

export const CONFIG = {
  mirrorCamera: true,
  smoothingAlpha: 0.25,

  pinchEnterThreshold: 0.45,
  pinchReleaseThreshold: 0.6,
  pinchSmoothingAlpha: 0.35,

  buttonHoverSelectMs: 300,
  buttonSelectCooldownMs: 800,
  controlsAutoHideMs: 3200,
  controlsWakeTopZone: 120,
  drawingTopMargin: 90,
  handLostHoldMs: 200,
  detectionIntervalMs: 33,
  pathSmoothingAlpha: 0.42,
  speedSmoothingAlpha: 0.28,

  three: {
    enabledByDefault: false,
    maxPixelRatio: 1.5,
    materialBrightness: 0.94,
    materialOpacityScale: 0.9,
    autoQuality: true,
    qualityDropFps: 42,
    qualityDropFrameMs: 24,
    qualityDisableFps: 24,
    qualityDisableFrameMs: 44,
    qualityWarmupMs: 3200,
    qualitySampleMs: 1600,
    depthDotCount: 42,
    pearlMaxCount: 140,
    pearlDepthRange: 180,
    vineMaxCount: 110,
    vineDepthRange: 150,
    vineGrowthMs: 780,
    branchMaxCount: 120,
    branchDepthRange: 180,
    branchGrowthMs: 920,
    butterflyMaxCount: 90,
    butterflyDepthRange: 240,
    butterflyFlySpread: 46,
    butterflyScatterMs: 1800
  },

  brushSpacing: {
    pearl: 12,
    flower: 34,
    grass: 10,
    vine: 9,
    branch: 28,
    butterfly: 85
  },

  speedDensity: {
    minSpeed: 0.08,
    maxSpeed: 1.2,
    minFactor: 0.66,
    maxFactor: 1.85,
    materialFactor: {
      pearl: 1,
      flower: 1,
      grass: 0.72,
      vine: 0.62,
      branch: 1,
      butterfly: 1
    }
  },

  maxStrokePoints: 5000,
  maxElementsPerBrush: 3000,
  persistentTrailMaterials: ["flower", "grass", "vine", "branch"],
  cachedStrokeMaterials: ["pearl", "flower", "grass", "vine", "branch"],
  debug: false,

  camera: {
    width: 1280,
    height: 720,
    facingMode: "user"
  },

  mediapipe: {
    wasmPath: "/vendor/mediapipe/wasm",
    modelAssetPath: "/vendor/mediapipe/models/hand_landmarker.task",
    delegate: "CPU",
    minHandDetectionConfidence: 0.35,
    minHandPresenceConfidence: 0.35,
    minTrackingConfidence: 0.35
  },

  colors: {
    background: "#edf7ef",
    ink: "#24332b",
    muted: "#6d766f",
    panel: "rgba(255, 255, 255, 0.82)",
    panelStroke: "rgba(39, 58, 48, 0.12)",
    active: "#ff7f9c",
    hover: "#ffd6df",
    cursor: "#2c9376",
    cursorPinch: "#ff6b7a",
    activeTrail: [255, 107, 122, 118],
    persistentTrail: [255, 107, 122, 135]
  }
};
