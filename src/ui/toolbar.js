export class Toolbar {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.clearButton = document.getElementById("clear-canvas");
    this.undoButton = document.getElementById("undo-stroke");
    this.saveButton = document.getElementById("save-png");
    this.fullscreenButton = document.getElementById("toggle-fullscreen");
    this.threeButton = document.getElementById("toggle-three");
    this.debugButton = document.getElementById("toggle-debug");
    this.mirrorButton = document.getElementById("toggle-mirror");
    this.mouseButton = document.getElementById("toggle-mouse");
    this.bindEvents();
  }

  bindEvents() {
    const stopPointer = (button) => button?.addEventListener("pointerdown", (event) => event.stopPropagation());
    [
      this.clearButton,
      this.undoButton,
      this.saveButton,
      this.fullscreenButton,
      this.threeButton,
      this.debugButton,
      this.mirrorButton,
      this.mouseButton
    ].forEach(stopPointer);

    this.clearButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onClear?.();
    });
    this.undoButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onUndo?.();
    });
    this.saveButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onSave?.();
    });
    this.fullscreenButton?.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onToggleFullscreen?.();
    });
    this.fullscreenButton?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onToggleFullscreen?.();
    });
    this.threeButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onToggleThree?.();
    });
    this.debugButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onToggleDebug?.();
    });
    this.mirrorButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onToggleMirror?.();
    });
    this.mouseButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onToggleMouse?.();
    });
  }

  update(state) {
    if (this.undoButton) {
      this.undoButton.disabled = !state.hasStrokes;
    }

    if (this.saveButton) {
      this.saveButton.disabled = !state.hasStrokes;
    }

    if (this.fullscreenButton) {
      this.fullscreenButton.classList.toggle("is-active", state.isFullscreen);
      this.fullscreenButton.setAttribute("aria-pressed", String(state.isFullscreen));
      this.fullscreenButton.textContent = state.isFullscreen ? "退出全屏" : "全屏";
    }

    if (this.threeButton) {
      this.threeButton.disabled = !state.threeAvailable;
      this.threeButton.classList.toggle("is-active", state.threeEnabled);
      this.threeButton.setAttribute("aria-pressed", String(state.threeEnabled));
      this.threeButton.textContent = state.threeAvailable ? "3D" : "3D不可用";
    }

    if (this.debugButton) {
      this.debugButton.classList.toggle("is-active", state.debug);
      this.debugButton.setAttribute("aria-pressed", String(state.debug));
    }

    if (this.mirrorButton) {
      this.mirrorButton.classList.toggle("is-active", state.mirror);
      this.mirrorButton.setAttribute("aria-pressed", String(state.mirror));
    }

    if (this.mouseButton) {
      this.mouseButton.classList.toggle("is-active", state.mouseMode);
      this.mouseButton.setAttribute("aria-pressed", String(state.mouseMode));
    }
  }
}
