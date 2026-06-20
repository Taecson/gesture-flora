export class DomMaterialMenu {
  constructor(materials, callbacks = {}) {
    this.materials = materials;
    this.onSelect = callbacks.onSelect ?? (() => {});
    this.root = document.getElementById("material-menu-fallback");
    this.buttons = new Map();
    this.render();
  }

  render() {
    if (!this.root) return;

    this.root.replaceChildren(
      ...this.materials.map((material) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.materialId = material.id;
        button.textContent = material.label;
        button.addEventListener("pointerdown", (event) => {
          event.stopPropagation();
        });
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          this.onSelect(material.id);
        });
        this.buttons.set(material.id, button);
        return button;
      })
    );
  }

  update(state, now = performance.now()) {
    for (const [id, button] of this.buttons) {
      const active = state.selectedMaterial === id;
      const hovered = state.hoveredButtonId === id;
      const pressed = state.clickedButtonId === id && now - state.clickedButtonAt < 260;
      const elapsed = hovered && state.hoverStartTime ? now - state.hoverStartTime : 0;
      const progress = Math.min(elapsed / 300, 1);

      button.classList.toggle("is-active", active);
      button.classList.toggle("is-hovered", hovered);
      button.classList.toggle("is-pressed", pressed);
      button.style.setProperty("--hover-progress", String(progress));
      button.setAttribute("aria-pressed", String(active));
    }
  }
}
