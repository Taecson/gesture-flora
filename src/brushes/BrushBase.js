export class BrushBase {
  constructor(config) {
    this.config = config;
    this.elements = [];
    this.currentStrokeId = null;
    this.maxElements = config.maxElementsPerBrush;
    this.nextElementId = 1;
  }

  beginStroke(_point, context = {}) {
    this.currentStrokeId = context.strokeId ?? null;
  }

  emit(_point, _tangent, _context) {}

  endStroke() {
    this.currentStrokeId = null;
  }

  addElement(element) {
    if (element.elementId == null) {
      element.elementId = this.nextElementId;
      this.nextElementId += 1;
    }

    this.elements.push(element);
    if (this.elements.length > this.maxElements) {
      this.elements.splice(0, this.elements.length - this.maxElements);
    }
  }

  draw(_p) {}

  reset() {
    this.elements = [];
    this.currentStrokeId = null;
    this.nextElementId = 1;
  }

  removeStroke(strokeId) {
    this.elements = this.elements.filter((element) => element.strokeId !== strokeId);
  }
}
