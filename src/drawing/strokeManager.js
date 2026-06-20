import { angleBetweenPoints, clamp, clonePoint, distance2D, lerp } from "../utils/math.js";

export class StrokeManager {
  constructor(brushes, config) {
    this.brushes = brushes;
    this.config = config;
    this.activeStroke = null;
    this.strokes = [];
    this.nextStrokeId = 1;
    this.cacheRevision = 0;
  }

  beginStroke(materialId, point, now = performance.now()) {
    if (!point || !this.brushes[materialId]) return;
    if (this.activeStroke) this.endStroke();

    const initialPoint = this.withTime(point, now);
    const stroke = {
      id: this.nextStrokeId,
      materialId,
      points: [initialPoint],
      lastGeneratedPoint: null,
      lastGeneratedAt: now,
      speed: 0
    };
    this.nextStrokeId += 1;
    this.activeStroke = stroke;

    const brush = this.brushes[materialId];
    brush.beginStroke(initialPoint, { strokeId: stroke.id });
    brush.emit(initialPoint, 0, { strokeId: stroke.id, previousPoint: null, speed: 0 });
    stroke.lastGeneratedPoint = initialPoint;
  }

  addPoint(point, now = performance.now()) {
    if (!this.activeStroke || !point) return;

    const stroke = this.activeStroke;
    const previousPoint = stroke.points[stroke.points.length - 1];
    const currentPoint = this.smoothPoint(point, previousPoint, now);
    const dt = Math.max(1, now - (previousPoint.t ?? now));
    const instantSpeed = distance2D(currentPoint, previousPoint) / dt;
    stroke.speed = lerp(stroke.speed ?? instantSpeed, instantSpeed, this.config.speedSmoothingAlpha);
    currentPoint.speed = stroke.speed;

    stroke.points.push(currentPoint);
    if (stroke.points.length > this.config.maxStrokePoints) {
      stroke.points.shift();
    }

    const spacing = this.getDynamicSpacing(stroke.materialId, stroke.speed);
    if (distance2D(currentPoint, stroke.lastGeneratedPoint) < spacing) return;

    const tangent = angleBetweenPoints(stroke.lastGeneratedPoint ?? previousPoint, currentPoint);
    this.brushes[stroke.materialId].emit(currentPoint, tangent, {
      strokeId: stroke.id,
      previousPoint,
      speed: stroke.speed,
      spacing
    });
    stroke.lastGeneratedPoint = currentPoint;
    stroke.lastGeneratedAt = now;
  }

  smoothPoint(rawPoint, previousPoint, now) {
    const raw = clonePoint(rawPoint);
    const distance = distance2D(raw, previousPoint);
    const alpha = clamp(this.config.pathSmoothingAlpha + distance / 260, this.config.pathSmoothingAlpha, 0.86);

    return {
      x: lerp(previousPoint.x, raw.x, alpha),
      y: lerp(previousPoint.y, raw.y, alpha),
      z: lerp(previousPoint.z ?? 0, raw.z ?? 0, alpha),
      t: now
    };
  }

  withTime(point, now) {
    return {
      ...clonePoint(point),
      t: now,
      speed: 0
    };
  }

  getDynamicSpacing(materialId, speed) {
    const baseSpacing = this.config.brushSpacing[materialId] ?? 24;
    const density = this.config.speedDensity;
    if (!density) return baseSpacing;

    const normalizedSpeed = clamp(
      (speed - density.minSpeed) / Math.max(0.001, density.maxSpeed - density.minSpeed),
      0,
      1
    );
    const speedFactor = lerp(density.minFactor, density.maxFactor, normalizedSpeed);
    const materialFactor = density.materialFactor?.[materialId] ?? 1;
    return Math.max(4, baseSpacing * speedFactor * materialFactor);
  }

  endStroke() {
    if (!this.activeStroke) return;
    const brush = this.brushes[this.activeStroke.materialId];
    brush?.endStroke();
    this.strokes.push(this.activeStroke);
    this.activeStroke = null;
    this.cacheRevision += 1;
  }

  isDrawing() {
    return Boolean(this.activeStroke);
  }

  hasStrokes() {
    return Boolean(this.activeStroke || this.strokes.length > 0);
  }

  draw(p) {
    Object.values(this.brushes).forEach((brush) => brush.draw(p));
  }

  drawLive(p) {
    const liveStrokeIds = this.getLiveStrokeIds();
    this.withFilteredBrushElements((element) => liveStrokeIds.has(element.strokeId), () => {
      Object.values(this.brushes).forEach((brush) => brush.draw(p));
    });
  }

  drawCachedStrokes(p, strokeColor) {
    const cachedStrokeIds = this.getCachedStrokeIds();
    this.strokes.forEach((stroke) => {
      if (!cachedStrokeIds.has(stroke.id)) return;
      if (this.shouldDrawTrail(stroke.materialId) && stroke.points.length >= 2) {
        this.drawPath(p, stroke.points, strokeColor);
      }
    });

    this.withFilteredBrushElements((element) => cachedStrokeIds.has(element.strokeId), () => {
      Object.values(this.brushes).forEach((brush) => brush.draw(p));
    });
  }

  drawActivePath(p, strokeColor) {
    if (!this.activeStroke || this.activeStroke.points.length < 2) return;
    if (!this.shouldDrawTrail(this.activeStroke.materialId)) return;

    const points = this.activeStroke.points.slice(-96);
    this.drawPath(p, points, strokeColor);
  }

  drawPersistentPaths(p, strokeColor) {
    this.strokes.forEach((stroke) => {
      if (!this.shouldDrawTrail(stroke.materialId) || stroke.points.length < 2) return;
      this.drawPath(p, stroke.points, strokeColor);
    });
  }

  shouldDrawTrail(materialId) {
    return this.config.persistentTrailMaterials?.includes(materialId);
  }

  shouldCacheStroke(materialId) {
    return this.config.cachedStrokeMaterials?.includes(materialId);
  }

  getCachedStrokeIds() {
    return new Set(this.strokes.filter((stroke) => this.shouldCacheStroke(stroke.materialId)).map((stroke) => stroke.id));
  }

  getLiveStrokeIds() {
    const ids = new Set();
    if (this.activeStroke) ids.add(this.activeStroke.id);
    this.strokes.forEach((stroke) => {
      if (!this.shouldCacheStroke(stroke.materialId)) ids.add(stroke.id);
    });
    return ids;
  }

  withFilteredBrushElements(predicate, drawCallback) {
    const originals = new Map();
    Object.entries(this.brushes).forEach(([id, brush]) => {
      originals.set(id, brush.elements);
      brush.elements = brush.elements.filter(predicate);
    });

    try {
      drawCallback();
    } finally {
      Object.entries(this.brushes).forEach(([id, brush]) => {
        brush.elements = originals.get(id) ?? brush.elements;
      });
    }
  }

  drawPath(p, points, strokeColor) {
    p.push();
    p.noFill();
    if (Array.isArray(strokeColor)) {
      p.stroke(...strokeColor);
    } else {
      p.stroke(strokeColor);
    }
    p.strokeWeight(3);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    p.beginShape();
    points.forEach((point) => p.vertex(point.x, point.y));
    p.endShape();
    p.pop();
  }

  clear() {
    this.activeStroke = null;
    this.strokes = [];
    Object.values(this.brushes).forEach((brush) => brush.reset());
    this.cacheRevision += 1;
  }

  undoLastStroke() {
    if (this.activeStroke) {
      const active = this.activeStroke;
      this.brushes[active.materialId]?.removeStroke(active.id);
      this.activeStroke = null;
      this.cacheRevision += 1;
      return active;
    }

    const stroke = this.strokes.pop();
    if (!stroke) return null;

    this.brushes[stroke.materialId]?.removeStroke(stroke.id);
    this.cacheRevision += 1;
    return stroke;
  }
}
