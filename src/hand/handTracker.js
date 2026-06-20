import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { extractHandPoints } from "./handLandmarks.js";
import { describeError, wrapError } from "../utils/error.js";

export class HandTracker {
  constructor(config, callbacks = {}) {
    this.config = config;
    this.onStatus = callbacks.onStatus ?? (() => {});
    this.onError = callbacks.onError ?? (() => {});
    this.video = document.getElementById("camera-feed");
    this.landmarker = null;
    this.ready = false;
    this.lastVideoTime = -1;
    this.lastDetectAt = 0;
    this.lastDetection = null;
    this.stream = null;
    this.debug = {
      ready: false,
      delegate: config.mediapipe.delegate,
      detectFrames: 0,
      handFrames: 0,
      noHandFrames: 0,
      detectErrors: 0,
      lastError: null,
      lastHandAt: 0,
      videoWidth: 0,
      videoHeight: 0,
      readyState: 0
    };
  }

  async init() {
    try {
      this.onStatus("请求摄像头权限...");
      await this.startCamera();

      this.onStatus("加载手势识别模型...");
      await this.loadModel();

      this.ready = true;
      this.debug.ready = true;
      this.onStatus("摄像头与手势模型已就绪");
    } catch (error) {
      this.ready = false;
      this.debug.ready = false;
      const readableError = error instanceof Error ? error : wrapError("初始化失败", error);
      this.onError(readableError);
      throw readableError;
    }
  }

  async startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("当前浏览器不支持摄像头访问。");
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: this.config.camera.width },
          height: { ideal: this.config.camera.height },
          facingMode: this.config.camera.facingMode
        }
      });
    } catch (error) {
      throw this.cameraError(error);
    }

    this.video.srcObject = this.stream;
    this.video.muted = true;
    this.video.playsInline = true;

    await new Promise((resolve, reject) => {
      this.video.onloadedmetadata = resolve;
      this.video.onerror = () => reject(new Error("摄像头视频流初始化失败。"));
    });

    try {
      await this.video.play();
      this.video.classList.add("is-visible");
    } catch (error) {
      throw wrapError("摄像头视频播放失败", error);
    }
  }

  async loadModel() {
    await this.assertAssetAvailable(
      `${this.config.mediapipe.wasmPath}/vision_wasm_internal.js`,
      "MediaPipe wasm"
    );
    await this.assertAssetAvailable(this.config.mediapipe.modelAssetPath, "MediaPipe 手部模型");

    let vision;
    try {
      vision = await FilesetResolver.forVisionTasks(this.config.mediapipe.wasmPath);
    } catch (error) {
      throw wrapError("MediaPipe wasm 初始化失败", error);
    }

    const options = this.createOptions(this.config.mediapipe.delegate);

    try {
      this.landmarker = await HandLandmarker.createFromOptions(vision, options);
    } catch (gpuError) {
      if (this.config.mediapipe.delegate !== "GPU") throw gpuError;
      this.onStatus("GPU 初始化失败，切换到 CPU...");
      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, this.createOptions("CPU"));
        this.debug.delegate = "CPU";
      } catch (cpuError) {
        throw new Error(
          [
            "MediaPipe 手部识别模型加载失败",
            `模型路径：${this.config.mediapipe.modelAssetPath}`,
            `GPU 错误：${describeError(gpuError)}`,
            `CPU 错误：${describeError(cpuError)}`
          ].join("；")
        );
      }
    }
  }

  async assertAssetAvailable(url, label) {
    try {
      let response = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (response.status === 405) {
        response = await fetch(url, { cache: "no-store" });
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      throw wrapError(`${label} 无法访问 (${url})`, error);
    }
  }

  cameraError(error) {
    if (error?.name === "NotAllowedError") {
      return new Error("摄像头权限被拒绝。请在浏览器地址栏重新允许摄像头权限。");
    }

    if (error?.name === "NotFoundError") {
      return new Error("没有找到可用摄像头。请确认摄像头已连接且没有被其他软件占用。");
    }

    if (error?.name === "NotReadableError") {
      return new Error("摄像头无法读取。请关闭正在占用摄像头的其他软件后刷新页面。");
    }

    return wrapError("摄像头启动失败", error);
  }

  createOptions(delegate) {
    this.debug.delegate = delegate;
    return {
      baseOptions: {
        modelAssetPath: this.config.mediapipe.modelAssetPath,
        delegate
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: this.config.mediapipe.minHandDetectionConfidence,
      minHandPresenceConfidence: this.config.mediapipe.minHandPresenceConfidence,
      minTrackingConfidence: this.config.mediapipe.minTrackingConfidence
    };
  }

  detect(timestampMs) {
    this.updateVideoDebug();

    if (!this.ready || !this.landmarker || this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }

    if (
      this.video.currentTime === this.lastVideoTime ||
      timestampMs - this.lastDetectAt < this.config.detectionIntervalMs
    ) {
      return this.lastDetection;
    }

    this.lastVideoTime = this.video.currentTime;
    this.lastDetectAt = timestampMs;
    this.debug.detectFrames += 1;
    const result = this.landmarker.detectForVideo(this.video, timestampMs);
    const landmarks = result.landmarks?.[0] ?? null;

    this.lastDetection = landmarks
      ? {
          landmarks,
          points: extractHandPoints(landmarks),
          handedness: result.handednesses?.[0]?.[0]?.categoryName ?? null
        }
      : null;

    if (this.lastDetection) {
      this.debug.handFrames += 1;
      this.debug.lastHandAt = performance.now();
    } else {
      this.debug.noHandFrames += 1;
    }
    this.debug.lastError = null;

    return this.lastDetection;
  }

  recordDetectError(error) {
    this.debug.detectErrors += 1;
    this.debug.lastError = describeError(error);
  }

  updateVideoDebug() {
    this.debug.readyState = this.video?.readyState ?? 0;
    this.debug.videoWidth = this.video?.videoWidth ?? 0;
    this.debug.videoHeight = this.video?.videoHeight ?? 0;
  }

  getDebugInfo() {
    this.updateVideoDebug();
    return { ...this.debug };
  }

  dispose() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.video?.classList.remove("is-visible");
    this.landmarker?.close();
  }
}
