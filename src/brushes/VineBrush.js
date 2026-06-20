import { BrushBase } from "./BrushBase.js";
import { randomRange, signedRandom } from "../utils/math.js";

export class VineBrush extends BrushBase {
  emit(point, tangent, context) {
    this.addElement({
      x: point.x,
      y: point.y,
      from: context.previousPoint,
      angle: tangent,
      leafSide: Math.random() > 0.5 ? 1 : -1,
      leafScale: randomRange(0.72, 1.12),
      leafTwist: signedRandom(0.35),
      stemWidth: randomRange(3.2, 5.4),
      hasTendril: Math.random() > 0.48,
      tendrilCurl: randomRange(0.65, 1.35),
      hasBud: Math.random() > 0.76,
      budColor: Math.random() > 0.5 ? [255, 190, 210] : [240, 229, 152],
      strokeId: context.strokeId
    });
  }

  draw(p) {
    p.push();
    p.strokeCap(p.ROUND);
    for (const node of this.elements) {
      if (node.from) {
        p.stroke(42, 104, 60, 170);
        p.strokeWeight(node.stemWidth + 1.4);
        p.line(node.from.x, node.from.y, node.x, node.y);
        p.stroke(91, 166, 95, 208);
        p.strokeWeight(node.stemWidth);
        p.line(node.from.x, node.from.y, node.x, node.y);
        p.stroke(198, 239, 175, 98);
        p.strokeWeight(1.1);
        p.line(node.from.x, node.from.y - 0.8, node.x, node.y - 0.8);
      }

      p.push();
      p.translate(node.x, node.y);
      p.rotate(node.angle + node.leafSide * 0.95 + node.leafTwist);
      drawLeaf(p, node.leafScale);
      p.pop();

      if (node.hasTendril) {
        drawTendril(p, node);
      }

      if (node.hasBud) {
        drawBud(p, node);
      }
    }
    p.pop();
  }
}

function drawLeaf(p, scale) {
  p.noStroke();
  p.fill(69, 151, 82, 210);
  p.beginShape();
  p.vertex(0, 0);
  p.bezierVertex(8 * scale, -7 * scale, 8 * scale, -18 * scale, 0, -25 * scale);
  p.bezierVertex(-8 * scale, -18 * scale, -8 * scale, -7 * scale, 0, 0);
  p.endShape(p.CLOSE);
  p.stroke(225, 255, 210, 96);
  p.strokeWeight(1);
  p.line(0, -2 * scale, 0, -19 * scale);
  p.noStroke();
  p.fill(37, 112, 62, 55);
  p.ellipse(0, -10 * scale, 8 * scale, 20 * scale);
}

function drawTendril(p, node) {
  p.push();
  p.translate(node.x, node.y);
  p.rotate(node.angle - node.leafSide * 0.92);
  p.noFill();
  p.stroke(119, 185, 105, 145);
  p.strokeWeight(1.2);
  p.beginShape();
  for (let i = 0; i < 16; i += 1) {
    const t = i / 15;
    const curl = t * Math.PI * 2.2 * node.tendrilCurl;
    const radius = 10 * (1 - t) * node.leafScale;
    p.vertex(t * 26 * node.leafScale, Math.sin(curl) * radius * 0.42);
  }
  p.endShape();
  p.pop();
}

function drawBud(p, node) {
  p.push();
  p.translate(node.x, node.y);
  p.rotate(node.angle + node.leafSide * 1.35);
  p.noStroke();
  p.fill(61, 137, 78, 178);
  p.ellipse(0, -7 * node.leafScale, 5 * node.leafScale, 11 * node.leafScale);
  p.fill(node.budColor[0], node.budColor[1], node.budColor[2], 205);
  p.circle(0, -13 * node.leafScale, 5.5 * node.leafScale);
  p.pop();
}
