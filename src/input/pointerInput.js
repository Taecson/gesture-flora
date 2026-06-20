export class PointerInput {
  constructor() {
    this.point = null;
    this.isDown = false;
    this.isOverUi = false;
    this.pointerId = null;
    this.moveCount = 0;
    this.downCount = 0;
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("pointermove", (event) => this.updateFromEvent(event), true);
    window.addEventListener("pointerdown", (event) => {
      this.updateFromEvent(event);
      this.downCount += 1;
      if (!this.isInteractiveTarget(event.target)) {
        this.isDown = true;
        this.pointerId = event.pointerId;
      }
    }, true);
    window.addEventListener("pointerup", (event) => {
      this.updateFromEvent(event);
      this.isDown = false;
      this.pointerId = null;
    }, true);
    window.addEventListener("pointercancel", () => {
      this.isDown = false;
      this.pointerId = null;
    }, true);
    window.addEventListener("mousemove", (event) => this.updateFromEvent(event), true);
    window.addEventListener("mousedown", (event) => {
      this.updateFromEvent(event);
      this.downCount += 1;
      if (!this.isInteractiveTarget(event.target)) {
        this.isDown = true;
      }
    }, true);
    window.addEventListener("mouseup", (event) => {
      this.updateFromEvent(event);
      this.isDown = false;
    }, true);
    window.addEventListener("blur", () => {
      this.isDown = false;
      this.pointerId = null;
    });
  }

  updateFromEvent(event) {
    this.moveCount += 1;
    this.point = {
      x: event.clientX,
      y: event.clientY,
      z: 0
    };
    this.isOverUi = this.isInteractiveTarget(event.target);
  }

  isInteractiveTarget(target) {
    return Boolean(target?.closest?.("#toolbar, #material-menu-fallback, #status-panel, #debug-panel"));
  }

  getDebugInfo() {
    return {
      point: this.point ? { ...this.point } : null,
      isDown: this.isDown,
      isOverUi: this.isOverUi,
      moveCount: this.moveCount,
      downCount: this.downCount
    };
  }
}
