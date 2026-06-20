import p5 from "p5";
import "./style.css";
import { appState } from "./appState.js";
import { APP_VERSION, CONFIG, MATERIALS } from "./config.js";
import { HandTracker } from "./hand/handTracker.js";
import { GestureDetector } from "./hand/gestureDetector.js";
import { PointSmoother } from "./hand/smoothing.js";
import { mapNormalizedPoint, isDrawingPoint } from "./utils/coordinate.js";
import { clamp } from "./utils/math.js";
import { StrokeManager } from "./drawing/strokeManager.js";
import { PointerInput } from "./input/pointerInput.js";
import { MaterialMenu } from "./ui/materialMenu.js";
import { DomMaterialMenu } from "./ui/domMaterialMenu.js";
import { DebugPanel } from "./ui/debugPanel.js";
import { Hud } from "./ui/hud.js";
import { Toolbar } from "./ui/toolbar.js";
import { ThreeOverlay } from "./three/threeApp.js";
import { PearlBrush } from "./brushes/PearlBrush.js";
import { FlowerBrush } from "./brushes/FlowerBrush.js";
import { GrassBrush } from "./brushes/GrassBrush.js";
import { VineBrush } from "./brushes/VineBrush.js";
import { BranchBrush } from "./brushes/BranchBrush.js";
import { ButterflyBrush } from "./brushes/ButterflyBrush.js";
import { describeError } from "./utils/error.js";

const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const errorPanel = document.getElementById("error-panel");

appState.version = APP_VERSION;
window.__GESTURE_FLORA_VERSION__ = APP_VERSION;

function setStatus(message) {
  appState.status = message;
  if (statusText) statusText.textContent = message;
  statusDot?.classList.remove("is-error");
}

function showError(error) {
  const message = describeError(error);
  appState.error = message;
  if (statusText) statusText.textContent = "初始化失败";
  statusDot?.classList.add("is-error");
  if (errorPanel) {
    errorPanel.hidden = false;
    errorPanel.textContent = message;
  }
}

window.addEventListener("error", (event) => {
  showError(event.error ?? event.message ?? event);
});

window.addEventListener("unhandledrejection", (event) => {
  showError(event.reason ?? event);
});

const sketch = (p) => {
  let handTracker;
  let gestureDetector;
  let indexSmoother;
  let thumbSmoother;
  let materialMenu;
  let domMaterialMenu;
  let debugPanel;
  let hud;
  let toolbar;
  let threeOverlay;
  let strokeManager;
  let pointerInput;
  let completedLayer;
  let completedLayerRevision = -1;
  let completedLayerResizePending = false;
  let lastHandSeenAt = -Infinity;
  let lastPointerMoveCount = 0;
  let lastThreeWarning = null;
  let lastGesture = {
    pinchRatio: null,
    isPinching: false,
    pinchJustStarted: false,
    pinchJustEnded: false
  };

  p.setup = () => {
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent("app");
    p.pixelDensity(1);
    p.frameRate(60);
    p.textFont("system-ui, -apple-system, BlinkMacSystemFont, sans-serif");

    const brushes = {
      pearl: new PearlBrush(CONFIG),
      flower: new FlowerBrush(CONFIG),
      grass: new GrassBrush(CONFIG),
      vine: new VineBrush(CONFIG),
      branch: new BranchBrush(CONFIG),
      butterfly: new ButterflyBrush(CONFIG)
    };

    strokeManager = new StrokeManager(brushes, CONFIG);
    completedLayer = createGraphicsLayer(p.width, p.height);
    threeOverlay = new ThreeOverlay(CONFIG.three);
    syncThreeState();
    pointerInput = new PointerInput();
    appState.controlsVisible = true;
    appState.lastControlsInteractionAt = p.millis();
    appState.isFullscreen = Boolean(getFullscreenElement());
    document.body.classList.remove("is-controls-hidden");
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    gestureDetector = new GestureDetector(CONFIG);
    indexSmoother = new PointSmoother(CONFIG.smoothingAlpha);
    thumbSmoother = new PointSmoother(CONFIG.smoothingAlpha);
    materialMenu = new MaterialMenu(MATERIALS, CONFIG);
    domMaterialMenu = new DomMaterialMenu(MATERIALS, {
      onSelect: (materialId) => {
        selectMaterial(materialId, "点击");
      }
    });
    debugPanel = new DebugPanel();
    hud = new Hud(CONFIG);
    toolbar = new Toolbar({
      onClear: () => {
        wakeControls();
        strokeManager.clear();
        appState.hasStrokes = false;
        setStatus("画布已清空");
      },
      onUndo: () => {
        wakeControls();
        const removed = strokeManager.undoLastStroke();
        appState.hasStrokes = strokeManager.hasStrokes();
        setStatus(removed ? "已撤销上一笔" : "没有可撤销的笔画");
      },
      onSave: () => {
        wakeControls();
        saveComposition();
      },
      onToggleFullscreen: () => {
        wakeControls();
        toggleFullscreen();
      },
      onToggleThree: () => {
        wakeControls();
        toggleThreeLayer();
      },
      onToggleDebug: () => {
        wakeControls();
        appState.debug = !appState.debug;
      },
      onToggleMirror: () => {
        wakeControls();
        appState.mirror = !appState.mirror;
        indexSmoother.reset();
        thumbSmoother.reset();
      },
      onToggleMouse: () => {
        wakeControls();
        appState.mouseMode = !appState.mouseMode;
        setStatus(appState.mouseMode ? "鼠标测试已开启：按住鼠标绘制" : "鼠标测试已关闭");
        if (!appState.mouseMode) {
          pointerInput.isDown = false;
        }
      }
    });

    handTracker = new HandTracker(CONFIG, {
      onStatus: setStatus,
      onError: showError
    });
    handTracker.init().catch(() => {});
  };

  p.draw = () => {
    try {
      runFrame();
    } catch (error) {
      appState.runtimeWarning = describeError(error);
      setStatus(`运行错误：${appState.runtimeWarning}`);
      debugPanel?.update(appState, strokeManager);
    }
  };

  function runFrame() {
    appState.fps = p.frameRate();
    appState.pointerDebug = pointerInput?.getDebugInfo() ?? null;
    appState.trackerDebug = handTracker?.getDebugInfo() ?? null;
    syncVideoPresentation();

    if (shouldUsePointerInput()) {
      updatePointerState();
    } else {
      try {
        const detection = handTracker?.detect(performance.now());
        appState.runtimeWarning = null;
        updateHandState(detection, p.millis());
      } catch (error) {
        handTracker?.recordDetectError(error);
        appState.trackerDebug = handTracker?.getDebugInfo() ?? null;
        appState.runtimeWarning = describeError(error);
        setStatus(`手势检测暂停：${appState.runtimeWarning}`);
        updateHandState(null, p.millis());
      }
    }

    const selectedByGesture = materialMenu.update(
      appState.indexPoint,
      p.millis(),
      appState,
      p.width,
      appState.isPinching
    );
    if (selectedByGesture) {
      selectMaterial(selectedByGesture, appState.mouseDown ? "鼠标点击" : "手势点击");
    }

    updateControlsVisibility(p.millis());
    updateDrawing();
    appState.hasStrokes = strokeManager.hasStrokes();
    updateDetectionStatus();

    drawFrameSafely();
    updateThreeLayer();
    toolbar.update(appState);
    domMaterialMenu.update(appState, p.millis());
    debugPanel.update(appState, strokeManager);
  }

  p.windowResized = () => {
    syncViewportSize();
    wakeControls();
  };

  function createGraphicsLayer(width, height) {
    const layer = p.createGraphics(width, height);
    layer.pixelDensity(1);
    return layer;
  }

  function disposeGraphicsLayer(layer) {
    if (!layer) return;

    try {
      if (layer._pInst?._elements && typeof layer.remove === "function") {
        layer.remove();
        return;
      }
    } catch (error) {
      console.warn("Graphics layer cleanup skipped:", error);
    }

    const element = layer.elt ?? layer.canvas ?? layer._renderer?.canvas;
    element?.remove?.();
  }

  function updateHandState(detection, now) {
    if (!detection?.points) {
      const isWithinHold = now - lastHandSeenAt <= CONFIG.handLostHoldMs;
      if (isWithinHold && appState.indexPoint) {
        appState.handVisible = true;
        return;
      }

      appState.handVisible = false;
      appState.indexPoint = null;
      appState.thumbPoint = null;
      indexSmoother.reset();
      thumbSmoother.reset();
      lastGesture = gestureDetector.update(null);
      appState.previousPinching = appState.isPinching;
      appState.isPinching = false;
      appState.pinchRatio = null;
      return;
    }

    lastHandSeenAt = now;
    appState.handVisible = true;
    const rawIndex = mapNormalizedPoint(detection.points.indexTip, p.width, p.height, appState.mirror);
    const rawThumb = mapNormalizedPoint(detection.points.thumbTip, p.width, p.height, appState.mirror);

    appState.indexPoint = indexSmoother.update(rawIndex);
    appState.thumbPoint = thumbSmoother.update(rawThumb);

    lastGesture = gestureDetector.update(detection.points);
    appState.previousPinching = appState.isPinching;
    appState.isPinching = lastGesture.isPinching;
    appState.pinchRatio = lastGesture.pinchRatio;
  }

  function shouldUsePointerInput() {
    return Boolean(appState.mouseMode || pointerInput?.isDown);
  }

  function updatePointerState() {
    const inputPoint = pointerInput.point ?? {
      x: p.width / 2,
      y: p.height / 2,
      z: 0
    };
    const pointer = {
      x: clamp(inputPoint.x, 0, p.width),
      y: clamp(inputPoint.y, 0, p.height),
      z: 0
    };
    const wasPinching = appState.isPinching;
    const isDown = pointerInput.isDown && !pointerInput.isOverUi;

    appState.handVisible = true;
    appState.indexPoint = pointer;
    appState.thumbPoint = pointer;
    appState.previousPinching = wasPinching;
    appState.mouseDown = isDown;
    appState.isPinching = isDown;
    appState.pinchRatio = isDown ? 0.1 : 1;
    lastGesture = {
      pinchRatio: appState.pinchRatio,
      isPinching: appState.isPinching,
      pinchJustStarted: !wasPinching && appState.isPinching,
      pinchJustEnded: wasPinching && !appState.isPinching
    };
  }

  function updateDrawing() {
    const pointer = appState.indexPoint;
    const inMenu = materialMenu.containsPoint(pointer);
    const canDraw =
      appState.handVisible &&
      pointer &&
      appState.isPinching &&
      !inMenu &&
      isDrawingPoint(pointer, CONFIG.drawingTopMargin);

    if (!canDraw) {
      if (strokeManager.isDrawing()) strokeManager.endStroke();
      return;
    }

    if (lastGesture.pinchJustStarted || !strokeManager.isDrawing()) {
      strokeManager.beginStroke(appState.selectedMaterial, pointer, p.millis());
    }

    strokeManager.addPoint(pointer, p.millis());
  }

  function selectMaterial(materialId, source = "选择") {
    if (!MATERIALS.some((material) => material.id === materialId)) return;

    appState.selectedMaterial = materialId;
    appState.lastButtonSelectTime = p.millis();
    appState.clickedButtonId = materialId;
    appState.clickedButtonAt = p.millis();
    const label = MATERIALS.find((material) => material.id === materialId)?.label ?? materialId;
    setStatus(`${source}：${label}`);
    wakeControls();
  }

  function updateControlsVisibility(now) {
    const pointer = pointerInput?.getDebugInfo();
    const pointerMoved = pointer && pointer.moveCount !== lastPointerMoveCount;
    if (pointerMoved) {
      lastPointerMoveCount = pointer.moveCount;
      wakeControls(now);
    }

    const handNearTop =
      appState.handVisible &&
      appState.indexPoint &&
      appState.indexPoint.y <= CONFIG.controlsWakeTopZone;
    const activeControlIntent =
      handNearTop ||
      appState.isPinching ||
      appState.hoveredButtonId ||
      pointerInput?.isOverUi;

    if (activeControlIntent) {
      wakeControls(now);
    }

    appState.controlsVisible = now - appState.lastControlsInteractionAt <= CONFIG.controlsAutoHideMs;
    document.body.classList.toggle("is-controls-hidden", !appState.controlsVisible);
  }

  function wakeControls(now = p.millis()) {
    appState.controlsVisible = true;
    appState.lastControlsInteractionAt = now;
    document.body.classList.remove("is-controls-hidden");
  }

  async function toggleFullscreen() {
    try {
      if (!getFullscreenElement()) {
        await requestDocumentFullscreen();
      } else {
        await exitDocumentFullscreen();
      }
      handleFullscreenChange();
    } catch (error) {
      setStatus(`全屏切换失败：${describeError(error)}`);
    }
  }

  function handleFullscreenChange() {
    appState.isFullscreen = Boolean(getFullscreenElement());
    scheduleViewportSync();
    wakeControls();
    setStatus(appState.isFullscreen ? "已进入全屏演示" : "已退出全屏");
  }

  function scheduleViewportSync() {
    syncViewportSize();
    [80, 220, 480].forEach((delay) => {
      window.setTimeout(syncViewportSize, delay);
    });
  }

  function syncViewportSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (p.width !== width || p.height !== height) {
      p.resizeCanvas(width, height, true);
    }

    completedLayerResizePending = true;
    completedLayerRevision = -1;
    threeOverlay?.resize(width, height);
  }

  function getFullscreenElement() {
    return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
  }

  async function requestDocumentFullscreen() {
    const targets = [document.documentElement, document.body, document.getElementById("app")].filter(Boolean);
    let lastError = null;

    for (const target of targets) {
      const request = target.requestFullscreen ?? target.webkitRequestFullscreen;
      if (!request) continue;

      try {
        await request.call(target, { navigationUI: "hide" });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (!lastError) {
      throw new Error("当前浏览器不支持全屏 API");
    }

    const message = describeError(lastError);
    if (message.includes("Permissions check failed") || document.fullscreenEnabled === false) {
      throw new Error("当前浏览器窗口不允许页面全屏");
    }

    throw lastError;
  }

  async function exitDocumentFullscreen() {
    const exit = document.exitFullscreen ?? document.webkitExitFullscreen;
    if (!exit) {
      throw new Error("当前浏览器不支持退出全屏");
    }

    await exit.call(document);
  }

  function toggleThreeLayer() {
    const shouldEnable = !appState.threeEnabled;
    const enabled = threeOverlay?.setEnabled(shouldEnable, p.width, p.height) ?? false;
    syncThreeState();

    if (enabled) {
      lastThreeWarning = null;
      setStatus("3D 透明叠层已开启");
      return;
    }

    if (shouldEnable && !appState.threeAvailable) {
      setStatus(`3D 叠层不可用：${appState.threeWarning ?? "WebGL 初始化失败"}`);
      return;
    }

    setStatus("3D 透明叠层已关闭");
  }

  function updateThreeLayer() {
    if (!threeOverlay) return;

    const wasEnabled = appState.threeEnabled;
    threeOverlay.render(appState, p.width, p.height, p.millis(), {
      pearlElements: strokeManager?.brushes?.pearl?.elements ?? [],
      vineElements: strokeManager?.brushes?.vine?.elements ?? [],
      branchElements: strokeManager?.brushes?.branch?.elements ?? [],
      butterflyElements: strokeManager?.brushes?.butterfly?.elements ?? []
    });
    syncThreeState();

    if (wasEnabled && !appState.threeEnabled) {
      setStatus(`3D 叠层已自动关闭：${appState.threeWarning ?? "渲染失败"}`);
      return;
    }

    if (appState.threeEnabled && appState.threeWarning && appState.threeWarning !== lastThreeWarning) {
      lastThreeWarning = appState.threeWarning;
      setStatus(appState.threeWarning);
    }
  }

  function syncThreeState() {
    const stats = threeOverlay?.getStats() ?? null;
    appState.threeStats = stats;
    appState.threeEnabled = Boolean(stats?.enabled);
    appState.threeAvailable = stats?.available !== false;
    appState.threeReady = Boolean(stats?.ready);
    appState.threeWarning = stats?.error ?? stats?.warning ?? null;
  }

  function drawFrameSafely() {
    try {
      drawSceneBase(p);
      syncCompletedLayerSize();
      rebuildCompletedLayerIfNeeded();
      if (completedLayer) {
        p.image(completedLayer, 0, 0);
      }
      strokeManager.drawActivePath(p, CONFIG.colors.activeTrail);
      strokeManager.drawLive(p);
      drawCursor(p);
      drawMaterialPreview(p);
      hud.draw(p, appState, strokeManager);
      appState.runtimeWarning = null;
    } catch (error) {
      appState.runtimeWarning = describeError(error);
      console.warn("Canvas draw skipped:", error);
    }
  }

  function syncCompletedLayerSize() {
    if (
      !completedLayerResizePending &&
      completedLayer?.width === p.width &&
      completedLayer?.height === p.height
    ) {
      return;
    }

    const previousLayer = completedLayer;
    completedLayer = createGraphicsLayer(p.width, p.height);
    completedLayerRevision = -1;
    completedLayerResizePending = false;
    disposeGraphicsLayer(previousLayer);
  }

  function rebuildCompletedLayerIfNeeded() {
    if (!completedLayer) return;
    if (completedLayerRevision === strokeManager.cacheRevision) return;

    completedLayer.clear();
    strokeManager.drawCachedStrokes(completedLayer, CONFIG.colors.persistentTrail);
    completedLayerRevision = strokeManager.cacheRevision;
  }

  function updateDetectionStatus() {
    if (appState.mouseMode || appState.error || appState.runtimeWarning) return;

    const tracker = appState.trackerDebug;
    if (!tracker?.ready) return;

    if (tracker.detectFrames > 45 && tracker.handFrames === 0) {
      setStatus("模型已运行，但暂未识别到手：请把手掌放到画面中央并提高光线");
    } else if (appState.handVisible) {
      setStatus(appState.isPinching ? "已识别手势：正在绘制" : "已识别手势：捏合开始绘制");
    }
  }

  function drawCursor(p5Instance) {
    if (!appState.indexPoint) return;
    const point = appState.indexPoint;
    const radius = appState.isPinching ? 13 : 10;
    p5Instance.push();
    p5Instance.noFill();
    p5Instance.stroke(appState.isPinching ? CONFIG.colors.cursorPinch : CONFIG.colors.cursor);
    p5Instance.strokeWeight(2.5);
    p5Instance.circle(point.x, point.y, radius * 2);
    p5Instance.noStroke();
    if (appState.isPinching) {
      p5Instance.fill(255, 107, 122, 61);
    } else {
      p5Instance.fill(44, 147, 118, 56);
    }
    p5Instance.circle(point.x, point.y, radius * 2.9);
    p5Instance.pop();
  }

  function drawMaterialPreview(p5Instance) {
    if (!appState.indexPoint) return;

    const point = appState.indexPoint;
    const x = clamp(point.x + 30, 24, p5Instance.width - 24);
    const y = clamp(point.y + 28, CONFIG.drawingTopMargin + 24, p5Instance.height - 24);

    p5Instance.push();
    p5Instance.translate(x, y);
    p5Instance.noStroke();
    p5Instance.fill(255, 255, 255, 220);
    p5Instance.circle(0, 0, 34);
    p5Instance.stroke(39, 58, 48, 30);
    p5Instance.noFill();
    p5Instance.circle(0, 0, 34);

    switch (appState.selectedMaterial) {
      case "pearl":
        drawPearlIcon(p5Instance);
        break;
      case "grass":
        drawGrassIcon(p5Instance);
        break;
      case "vine":
        drawVineIcon(p5Instance);
        break;
      case "branch":
        drawBranchIcon(p5Instance);
        break;
      case "butterfly":
        drawButterflyIcon(p5Instance);
        break;
      case "flower":
      default:
        drawFlowerIcon(p5Instance);
        break;
    }
    p5Instance.pop();
  }

  function drawPearlIcon(p5Instance) {
    p5Instance.noStroke();
    p5Instance.fill(250, 239, 240, 245);
    p5Instance.circle(0, 0, 18);
    p5Instance.fill(255, 255, 255, 220);
    p5Instance.circle(-4, -4, 5);
  }

  function drawFlowerIcon(p5Instance) {
    p5Instance.noStroke();
    p5Instance.fill(255, 209, 224, 235);
    for (let i = 0; i < 6; i += 1) {
      p5Instance.push();
      p5Instance.rotate((p5Instance.TWO_PI / 6) * i);
      p5Instance.ellipse(0, -6, 7, 13);
      p5Instance.pop();
    }
    p5Instance.fill(248, 213, 116, 240);
    p5Instance.circle(0, 0, 7);
  }

  function drawGrassIcon(p5Instance) {
    p5Instance.noFill();
    p5Instance.stroke(61, 145, 82, 230);
    p5Instance.strokeWeight(2);
    p5Instance.bezier(-7, 8, -5, 0, -7, -5, -2, -10);
    p5Instance.bezier(0, 9, 1, 1, 0, -6, 4, -12);
    p5Instance.bezier(6, 8, 4, 1, 7, -4, 10, -9);
  }

  function drawVineIcon(p5Instance) {
    p5Instance.noFill();
    p5Instance.stroke(66, 139, 85, 230);
    p5Instance.strokeWeight(2.4);
    p5Instance.bezier(-10, 7, -2, -8, 4, 11, 11, -5);
    p5Instance.noStroke();
    p5Instance.fill(91, 167, 96, 220);
    p5Instance.ellipse(-1, -4, 7, 13);
    p5Instance.ellipse(8, 1, 7, 13);
  }

  function drawBranchIcon(p5Instance) {
    p5Instance.stroke(126, 92, 70, 230);
    p5Instance.strokeWeight(2.4);
    p5Instance.line(-10, 8, 8, -8);
    p5Instance.line(0, -1, 11, 2);
    p5Instance.noStroke();
    p5Instance.fill(255, 182, 199, 230);
    p5Instance.circle(12, 2, 8);
  }

  function drawButterflyIcon(p5Instance) {
    p5Instance.noStroke();
    p5Instance.fill(244, 144, 170, 225);
    p5Instance.ellipse(-5, -3, 11, 15);
    p5Instance.ellipse(5, -3, 11, 15);
    p5Instance.fill(166, 153, 230, 205);
    p5Instance.ellipse(-4, 6, 8, 10);
    p5Instance.ellipse(4, 6, 8, 10);
    p5Instance.fill(61, 52, 58, 220);
    p5Instance.ellipse(0, 1, 4, 18);
  }

  function syncVideoPresentation() {
    const video = handTracker?.video;
    if (!video) return;

    const isVisible = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    appState.cameraVisible = isVisible;
    video.classList.toggle("is-visible", isVisible);
    video.classList.toggle("is-mirrored", appState.mirror);
  }

  function drawSceneBase(p5Instance) {
    p5Instance.clear();
  }

  function saveComposition() {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = p.width;
    exportCanvas.height = p.height;
    const ctx = exportCanvas.getContext("2d");
    const video = handTracker?.video;

    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    if (video?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ctx.save();
      if (appState.mirror) {
        ctx.translate(exportCanvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);
      ctx.restore();
    }

    const artworkLayer = p.createGraphics(exportCanvas.width, exportCanvas.height);
    artworkLayer.clear();
    artworkLayer.frameCount = p.frameCount;
    strokeManager.drawPersistentPaths(artworkLayer, CONFIG.colors.persistentTrail);
    strokeManager.draw(artworkLayer);
    ctx.drawImage(artworkLayer.elt, 0, 0);
    disposeGraphicsLayer(artworkLayer);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.download = `gesture-flora-${timestamp}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    document.body.append(link);
    link.click();
    link.remove();
    setStatus("已保存 PNG");
  }
};

new p5(sketch);
