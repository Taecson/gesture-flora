import { BrushBase } from "./BrushBase.js";
import { randomInt, randomRange, signedRandom } from "../utils/math.js";

const PETAL_COLORS = [
  [255, 220, 232],
  [255, 238, 243],
  [247, 217, 231],
  [237, 229, 255],
  [255, 246, 232]
];

export class FlowerBrush extends BrushBase {
  emit(point, tangent, context) {
    const color = PETAL_COLORS[randomInt(0, PETAL_COLORS.length - 1)];
    const innerColor = [
      Math.min(255, color[0] + randomRange(2, 10)),
      Math.min(255, color[1] + randomRange(5, 14)),
      Math.min(255, color[2] + randomRange(4, 12))
    ];

    this.addElement({
      x: point.x,
      y: point.y,
      angle: tangent + signedRandom(0.45),
      scale: randomRange(0.82, 1.34),
      petalCount: randomInt(5, 7),
      innerPetalCount: randomInt(5, 8),
      color,
      innerColor,
      center: randomRange(0, 1),
      centerSeed: randomRange(0, Math.PI * 2),
      hasLeaves: Math.random() > 0.28,
      leafSide: Math.random() > 0.5 ? 1 : -1,
      leafScale: randomRange(0.65, 1.05),
      petalJitter: signedRandom(0.16),
      highlightAngle: randomRange(0, Math.PI * 2),
      strokeId: context.strokeId
    });
  }

  draw(p) {
    p.push();
    p.noStroke();
    for (const flower of this.elements) {
      const size = 13 * flower.scale;
      p.push();
      p.translate(flower.x, flower.y);
      p.rotate(flower.angle);

      if (flower.hasLeaves) {
        drawLeaf(p, -flower.leafSide * size * 0.42, size * 0.42, flower.leafSide, size * flower.leafScale);
        if (flower.scale > 1.02) {
          drawLeaf(p, flower.leafSide * size * 0.32, size * 0.5, -flower.leafSide, size * flower.leafScale * 0.72);
        }
      }

      p.fill(95, 148, 92, 42);
      p.ellipse(1.5, 3, size * 1.95, size * 1.16);

      for (let i = 0; i < flower.petalCount; i += 1) {
        const angle = (p.TWO_PI / flower.petalCount) * i + flower.petalJitter;
        p.push();
        p.rotate(angle);
        p.fill(flower.color[0], flower.color[1], flower.color[2], 204);
        p.ellipse(0, -size * 0.5, size * 0.66, size * 1.14);
        p.fill(255, 255, 255, 48);
        p.ellipse(-size * 0.05, -size * 0.66, size * 0.24, size * 0.5);
        p.pop();
      }

      p.rotate(p.PI / flower.innerPetalCount);
      for (let i = 0; i < flower.innerPetalCount; i += 1) {
        const angle = (p.TWO_PI / flower.innerPetalCount) * i;
        p.push();
        p.rotate(angle);
        p.fill(flower.innerColor[0], flower.innerColor[1], flower.innerColor[2], 185);
        p.ellipse(0, -size * 0.32, size * 0.36, size * 0.72);
        p.pop();
      }

      p.fill(250, 215 + flower.center * 18, 132 + flower.center * 24, 238);
      p.circle(0, 0, size * 0.54);
      p.fill(134, 95, 52, 72);
      for (let i = 0; i < 5; i += 1) {
        const dotAngle = flower.centerSeed + (p.TWO_PI / 5) * i;
        p.circle(Math.cos(dotAngle) * size * 0.13, Math.sin(dotAngle) * size * 0.13, size * 0.08);
      }
      p.fill(255, 255, 255, 96);
      p.circle(Math.cos(flower.highlightAngle) * size * 0.12, Math.sin(flower.highlightAngle) * size * 0.12, size * 0.18);
      p.pop();
    }
    p.pop();
  }
}

function drawLeaf(p, x, y, side, size) {
  p.push();
  p.translate(x, y);
  p.rotate(side * 0.78);
  p.noStroke();
  p.fill(80, 153, 98, 178);
  p.ellipse(0, 0, size * 0.42, size * 0.9);
  p.stroke(229, 255, 220, 88);
  p.strokeWeight(1);
  p.line(0, size * 0.28, 0, -size * 0.26);
  p.pop();
}
