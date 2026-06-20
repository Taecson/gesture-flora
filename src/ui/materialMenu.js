export class MaterialMenu {
  constructor(materials, config) {
    this.materials = materials;
    this.config = config;
    this.rects = [];
  }

  layout(width) {
    const margin = 14;
    const gap = width < 620 ? 6 : 10;
    const available = width - margin * 2 - gap * (this.materials.length - 1);
    const buttonWidth = Math.max(48, Math.min(112, available / this.materials.length));
    const totalWidth = buttonWidth * this.materials.length + gap * (this.materials.length - 1);
    const startX = (width - totalWidth) / 2;

    this.rects = this.materials.map((material, index) => ({
      id: material.id,
      label: material.label,
      x: startX + index * (buttonWidth + gap),
      y: 18,
      w: buttonWidth,
      h: 44
    }));
  }

  update(pointer, now, state, width, isClicking = false) {
    this.layout(width);
    const hovered = this.findHovered(pointer);

    if (!hovered) {
      state.hoveredButtonId = null;
      state.hoverStartTime = null;
      return null;
    }

    if (state.hoveredButtonId !== hovered.id) {
      state.hoveredButtonId = hovered.id;
      state.hoverStartTime = now;
      return null;
    }

    const cooldownPassed = now - state.lastButtonSelectTime > this.config.buttonSelectCooldownMs;
    if (isClicking && cooldownPassed) {
      state.clickedButtonId = hovered.id;
      state.clickedButtonAt = now;
      return hovered.id;
    }

    const hoverDuration = now - (state.hoverStartTime ?? now);
    if (
      hoverDuration >= this.config.buttonHoverSelectMs &&
      cooldownPassed &&
      state.selectedMaterial !== hovered.id
    ) {
      state.selectedMaterial = hovered.id;
      state.lastButtonSelectTime = now;
      return hovered.id;
    }

    return null;
  }

  findHovered(pointer) {
    if (!pointer) return null;
    return this.rects.find(
      (rect) =>
        pointer.x >= rect.x &&
        pointer.x <= rect.x + rect.w &&
        pointer.y >= rect.y &&
        pointer.y <= rect.y + rect.h
    );
  }

  containsPoint(pointer) {
    return Boolean(pointer && pointer.y <= this.config.drawingTopMargin);
  }

  draw(p, state) {
    this.layout(p.width);
    p.push();
    p.noStroke();
    p.fill(255, 255, 255, 210);
    p.rect(0, 0, p.width, this.config.drawingTopMargin);
    p.stroke(31, 58, 44, 24);
    p.line(0, this.config.drawingTopMargin - 0.5, p.width, this.config.drawingTopMargin - 0.5);

    for (const rect of this.rects) {
      const isActive = state.selectedMaterial === rect.id;
      const isHovered = state.hoveredButtonId === rect.id;
      const elapsed = isHovered && state.hoverStartTime ? p.millis() - state.hoverStartTime : 0;
      const progress = Math.min(elapsed / this.config.buttonHoverSelectMs, 1);

      p.noStroke();
      if (isActive) {
        p.fill(255, 127, 156, 230);
      } else if (isHovered) {
        p.fill(255, 214, 223, 230);
      } else {
        p.fill(255, 255, 255, 225);
      }
      p.rect(rect.x, rect.y, rect.w, rect.h, 8);

      if (isHovered && !isActive) {
        p.fill(255, 127, 156, 70);
        p.rect(rect.x, rect.y + rect.h - 5, rect.w * progress, 5, 0, 0, 8, 8);
      }

      p.noFill();
      p.stroke(isActive ? "rgba(120, 42, 62, 0.28)" : "rgba(39, 58, 48, 0.16)");
      p.strokeWeight(1);
      p.rect(rect.x, rect.y, rect.w, rect.h, 8);

      p.noStroke();
      p.fill(isActive ? 255 : 36, isActive ? 255 : 51, isActive ? 255 : 43);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(rect.w < 60 ? 14 : 16);
      p.textStyle(p.BOLD);
      p.text(rect.label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    }
    p.pop();
  }
}
