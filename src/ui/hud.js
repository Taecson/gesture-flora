export class Hud {
  constructor(config) {
    this.config = config;
  }

  draw(p, state, strokeManager) {
    if (!state.debug) return;

    const tracker = state.trackerDebug;
    const lines = [
      `FPS ${Math.round(state.fps)}`,
      `模式 ${state.mouseMode ? "鼠标测试" : "手势"}`,
      `摄像头 ${state.cameraVisible ? "可见" : "未显示"}`,
      `手 ${state.handVisible ? "可见" : "未检测"}`,
      `捏合 ${state.isPinching ? "是" : "否"}`,
      `ratio ${state.pinchRatio == null ? "--" : state.pinchRatio.toFixed(2)}`,
      `素材 ${state.selectedMaterial}`,
      `笔画 ${strokeManager.strokes.length + (strokeManager.isDrawing() ? 1 : 0)}`,
      `3D ${state.threeEnabled ? `${state.threeStats?.fps ?? 0}fps` : "off"}`
    ];

    if (tracker) {
      lines.push(
        `模型 ${tracker.ready ? "ready" : "loading"} ${tracker.delegate}`,
        `视频 ${tracker.videoWidth}x${tracker.videoHeight} r${tracker.readyState}`,
        `检测 ${tracker.detectFrames}/${tracker.handFrames}`,
        `错误 ${tracker.detectErrors}`
      );
      if (tracker.lastError) {
        lines.push(`err ${tracker.lastError.slice(0, 24)}`);
      }
    }

    const w = 160;
    const h = 24 + lines.length * 18;
    const x = 14;
    const y = p.height - h - 58;

    p.push();
    p.noStroke();
    p.fill(255, 255, 255, 215);
    p.rect(x, y, w, h, 8);
    p.stroke(31, 58, 44, 22);
    p.noFill();
    p.rect(x, y, w, h, 8);
    p.noStroke();
    p.fill(39, 51, 43, 220);
    p.textSize(12);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);
    lines.forEach((line, index) => {
      p.text(line, x + 12, y + 12 + index * 18);
    });
    p.pop();
  }
}
