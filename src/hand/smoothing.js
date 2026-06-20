import { lerp } from "../utils/math.js";

export class PointSmoother {
  constructor(alpha) {
    this.alpha = alpha;
    this.current = null;
  }

  update(point) {
    if (!point) {
      this.reset();
      return null;
    }

    if (!this.current) {
      this.current = { ...point };
      return this.current;
    }

    this.current = {
      x: lerp(this.current.x, point.x, this.alpha),
      y: lerp(this.current.y, point.y, this.alpha),
      z: lerp(this.current.z ?? 0, point.z ?? 0, this.alpha)
    };

    return this.current;
  }

  reset() {
    this.current = null;
  }
}

export class ScalarSmoother {
  constructor(alpha) {
    this.alpha = alpha;
    this.current = null;
  }

  update(value) {
    if (value == null || Number.isNaN(value)) {
      this.reset();
      return null;
    }

    if (this.current == null) {
      this.current = value;
      return this.current;
    }

    this.current = lerp(this.current, value, this.alpha);
    return this.current;
  }

  reset() {
    this.current = null;
  }
}
