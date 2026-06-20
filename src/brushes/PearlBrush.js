import { BrushBase } from "./BrushBase.js";
import { randomRange, signedRandom } from "../utils/math.js";

export class PearlBrush extends BrushBase {
  emit(point, tangent, context) {
    const radius = randomRange(5.5, 11);
    const normal = tangent + Math.PI / 2;
    const offset = signedRandom(2.4);

    this.addElement({
      x: point.x + Math.cos(normal) * offset,
      y: point.y + Math.sin(normal) * offset,
      angle: tangent,
      radius,
      alpha: randomRange(205, 245),
      warm: randomRange(0, 16),
      blush: randomRange(0, 1),
      depth: randomRange(-1, 1),
      shimmer: randomRange(0.65, 1.25),
      shadowOffset: randomRange(1.4, 2.8),
      highlightScale: randomRange(0.42, 0.62),
      rim: randomRange(0.78, 1.08),
      strokeId: context.strokeId
    });
  }

  draw(p) {
    p.push();
    p.noStroke();
    for (const pearl of this.elements) {
      const r = pearl.radius;
      const warmR = 246 + pearl.warm * 0.22;
      const warmG = 238 + pearl.warm * 0.72;
      const warmB = 238 + pearl.warm * 0.58;

      p.fill(46, 34, 45, 34);
      p.ellipse(pearl.x + pearl.shadowOffset, pearl.y + pearl.shadowOffset, r * 2.15, r * 1.8);

      p.fill(warmR, warmG, warmB, pearl.alpha);
      p.circle(pearl.x, pearl.y, r * 2);
      p.fill(255, 250, 253, 96);
      p.circle(pearl.x - r * 0.12, pearl.y - r * 0.16, r * 1.55);
      p.fill(255, 255, 255, 218);
      p.circle(pearl.x - r * 0.38, pearl.y - r * 0.38, r * pearl.highlightScale);
      p.fill(234, 178 + pearl.blush * 32, 196 + pearl.blush * 28, 62);
      p.circle(pearl.x + r * 0.28, pearl.y + r * 0.28, r * 1.18);

      p.noFill();
      p.stroke(255, 255, 255, 105);
      p.strokeWeight(1);
      p.circle(pearl.x, pearl.y, r * 2 * pearl.rim);
      p.noStroke();
    }
    p.pop();
  }
}
