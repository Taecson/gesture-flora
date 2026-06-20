export class DebugPanel {
  constructor() {
    this.root = document.getElementById("debug-panel");
  }

  update(state, strokeManager) {
    if (!this.root) return;
    if (!state.debug) {
      this.root.hidden = true;
      return;
    }

    const tracker = state.trackerDebug;
    const pointer = state.pointerDebug;
    const lines = [
      `版本: ${state.version ?? "--"}`,
      `模式: ${state.mouseMode ? "鼠标测试" : "手势"}`,
      `摄像头: ${state.cameraVisible ? "可见" : "未显示"}`,
      `指针: ${state.indexPoint ? `${Math.round(state.indexPoint.x)}, ${Math.round(state.indexPoint.y)}` : "--"}`,
      `手/输入: ${state.handVisible ? "可用" : "未检测"}`,
      `捏合/按下: ${state.isPinching ? "是" : "否"}`,
      `素材: ${state.selectedMaterial}`,
      `笔画: ${strokeManager.strokes.length + (strokeManager.isDrawing() ? 1 : 0)}`
    ];

    if (pointer) {
      lines.push(
        `事件: move ${pointer.moveCount} down ${pointer.downCount}`,
        `鼠标: ${pointer.point ? `${Math.round(pointer.point.x)}, ${Math.round(pointer.point.y)}` : "--"}`,
        `按下: ${pointer.isDown ? "是" : "否"} UI:${pointer.isOverUi ? "是" : "否"}`
      );
    }

    if (tracker) {
      lines.push(
        `模型: ${tracker.ready ? "ready" : "loading"} ${tracker.delegate}`,
        `视频: ${tracker.videoWidth}x${tracker.videoHeight} r${tracker.readyState}`,
        `检测: ${tracker.detectFrames}/${tracker.handFrames}`,
        `错误: ${tracker.detectErrors}`
      );
      if (tracker.lastError) {
        lines.push(`err: ${tracker.lastError.slice(0, 42)}`);
      }
    }

    if (state.threeStats) {
      const three = state.threeStats;
      lines.push(
        `3D: ${state.threeEnabled ? "开启" : "关闭"} ${three.ready ? "ready" : "idle"}`,
        `3D fps: ${three.fps} frame ${three.frameTimeMs.toFixed(1)}ms`,
        `3D quality: ${three.qualityLabel ?? "--"} x${(three.qualityScale ?? 1).toFixed(2)}`,
        `3D draw: ${three.renderCalls} tri ${three.triangles} pts ${three.points}`,
        `3D pearl: ${three.pearlObjects ?? 0}`,
        `3D vine: ${three.vineObjects ?? 0}`,
        `3D branch: ${three.branchObjects ?? 0}`,
        `3D butterfly: ${three.butterflyObjects ?? 0}`
      );
      if (state.threeWarning || three.error) {
        lines.push(`3D err: ${(state.threeWarning ?? three.error).slice(0, 42)}`);
      }
    }

    if (state.runtimeWarning) {
      lines.push(`警告: ${state.runtimeWarning.slice(0, 52)}`);
    }

    this.root.textContent = lines.join("\n");
    this.root.hidden = false;
  }
}
