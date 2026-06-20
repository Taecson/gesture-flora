import { BrushBase } from "./BrushBase.js";
import { randomRange, signedRandom } from "../utils/math.js";

const WING_COLORS = [
  [248, 147, 170],
  [244, 176, 92],
  [166, 153, 230],
  [105, 184, 200]
];

export class ButterflyBrush extends BrushBase {
  emit(point, tangent, context) {
    const color = WING_COLORS[Math.floor(Math.random() * WING_COLORS.length)];
    this.addElement({
      x: point.x,
      y: point.y,
      anchorX: point.x,
      anchorY: point.y,
      angle: tangent + signedRandom(0.25),
      scale: randomRange(0.75, 1.18),
      phase: randomRange(0, Math.PI * 2),
      orbit: signedRandom(16),
      lift: randomRange(6, 16),
      drift: randomRange(0.45, 1.1),
      color,
      accent: [Math.min(255, color[0] + 26), Math.min(255, color[1] + 22), Math.min(255, color[2] + 32)],
      strokeId: context.strokeId
    });
  }

  draw(p) {
    p.push();
    p.noStroke();
    for (const butterfly of this.elements) {
      const t = p.frameCount * 0.08 * butterfly.drift + butterfly.phase;
      const sideX = Math.sin(t * 0.72) * butterfly.orbit;
      const floatY = Math.sin(t * 1.1) * butterfly.lift;
      const flap = 0.78 + Math.sin(t * 2.8) * 0.2;
      const size = 12 * butterfly.scale;
      const x = butterfly.anchorX + Math.cos(butterfly.angle + Math.PI / 2) * sideX;
      const y = butterfly.anchorY + floatY;

      drawTrail(p, butterfly, x, y, t);
      p.push();
      p.translate(x, y);
      p.rotate(butterfly.angle + Math.sin(t * 0.6) * 0.18);

      p.fill(butterfly.color[0], butterfly.color[1], butterfly.color[2], 205);
      p.ellipse(-size * 0.48, -size * 0.2, size * 0.82 * flap, size * 1.22);
      p.ellipse(size * 0.48, -size * 0.2, size * 0.82 * flap, size * 1.22);
      p.fill(butterfly.accent[0], butterfly.accent[1], butterfly.accent[2], 115);
      p.ellipse(-size * 0.5, -size * 0.38, size * 0.34 * flap, size * 0.56);
      p.ellipse(size * 0.5, -size * 0.38, size * 0.34 * flap, size * 0.56);
      p.fill(butterfly.color[0] * 0.78, butterfly.color[1] * 0.78, butterfly.color[2] * 0.78, 188);
      p.ellipse(-size * 0.34, size * 0.36, size * 0.56 * flap, size * 0.76);
      p.ellipse(size * 0.34, size * 0.36, size * 0.56 * flap, size * 0.76);
      p.fill(255, 255, 255, 96);
      p.circle(-size * 0.56, -size * 0.36, size * 0.12);
      p.circle(size * 0.56, -size * 0.36, size * 0.12);
      p.fill(58, 52, 57, 185);
      p.ellipse(0, 0, size * 0.18, size * 1.1);
      p.stroke(58, 52, 57, 128);
      p.strokeWeight(0.8);
      p.noFill();
      p.line(-size * 0.04, -size * 0.5, -size * 0.32, -size * 0.82);
      p.line(size * 0.04, -size * 0.5, size * 0.32, -size * 0.82);
      p.pop();
    }
    p.pop();
  }
}

function drawTrail(p, butterfly, x, y, t) {
  p.noStroke();
  for (let i = 0; i < 4; i += 1) {
    const delay = i + 1;
    const tx = x - Math.cos(butterfly.angle) * delay * 8 + Math.sin(t - delay) * 2.5;
    const ty = y - Math.sin(butterfly.angle) * delay * 8 + Math.cos(t - delay) * 2.5;
    p.fill(butterfly.color[0], butterfly.color[1], butterfly.color[2], 46 - i * 8);
    p.circle(tx, ty, (5 - i) * butterfly.scale);
  }
}
