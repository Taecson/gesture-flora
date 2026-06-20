import { BrushBase } from "./BrushBase.js";
import { randomInt, randomRange, signedRandom } from "../utils/math.js";

export class BranchBrush extends BrushBase {
  emit(point, tangent, context) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const branchLength = randomRange(18, 38);
    const branchAngle = tangent + side * randomRange(0.58, 1.12);

    this.addElement({
      x: point.x,
      y: point.y,
      from: context.previousPoint,
      angle: tangent,
      side,
      trunkWidth: randomRange(3.2, 5.8),
      branchLength,
      branchAngle,
      twigLength: branchLength * randomRange(0.35, 0.62),
      twigSide: Math.random() > 0.5 ? 1 : -1,
      twigAngleOffset: randomRange(0.62, 1.04),
      blossomSize: randomRange(5, 9),
      blossomOffsetX: signedRandom(1),
      blossomOffsetY: signedRandom(1),
      blossomPetals: randomInt(4, 6),
      budCount: randomInt(1, 3),
      budTone: Math.random() > 0.5 ? [255, 177, 195] : [255, 214, 169],
      strokeId: context.strokeId
    });
  }

  draw(p) {
    p.push();
    p.strokeCap(p.ROUND);
    for (const branch of this.elements) {
      if (branch.from) {
        p.stroke(73, 47, 37, 72);
        p.strokeWeight(branch.trunkWidth + 2);
        p.line(branch.from.x, branch.from.y + 1.2, branch.x, branch.y + 1.2);
        p.stroke(118, 82, 61, 210);
        p.strokeWeight(branch.trunkWidth);
        p.line(branch.from.x, branch.from.y, branch.x, branch.y);
        p.stroke(183, 132, 93, 88);
        p.strokeWeight(1);
        p.line(branch.from.x, branch.from.y - 1, branch.x, branch.y - 1);
      }

      const endX = branch.x + Math.cos(branch.branchAngle) * branch.branchLength;
      const endY = branch.y + Math.sin(branch.branchAngle) * branch.branchLength;
      p.stroke(104, 70, 51, 186);
      p.strokeWeight(2.6);
      p.line(branch.x, branch.y, endX, endY);
      p.stroke(178, 125, 87, 80);
      p.strokeWeight(0.9);
      p.line(branch.x, branch.y - 0.8, endX, endY - 0.8);

      const twigAngle = branch.branchAngle + branch.twigSide * branch.twigAngleOffset;
      const twigX = branch.x + Math.cos(branch.branchAngle) * branch.branchLength * 0.58;
      const twigY = branch.y + Math.sin(branch.branchAngle) * branch.branchLength * 0.58;
      const twigEndX = twigX + Math.cos(twigAngle) * branch.twigLength;
      const twigEndY = twigY + Math.sin(twigAngle) * branch.twigLength;
      p.stroke(111, 75, 54, 155);
      p.strokeWeight(1.6);
      p.line(twigX, twigY, twigEndX, twigEndY);

      drawBudCluster(p, branch, twigEndX, twigEndY, twigAngle, 0.68);
      drawFlower(p, branch, endX, endY, branch.branchAngle);
    }
    p.pop();
  }
}

function drawBudCluster(p, branch, x, y, angle, scale) {
  p.push();
  p.translate(x, y);
  p.rotate(angle);
  p.noStroke();
  for (let i = 0; i < branch.budCount; i += 1) {
    const offset = (i - (branch.budCount - 1) / 2) * 4.5 * scale;
    p.fill(84, 126, 79, 160);
    p.ellipse(offset, -2 * scale, 4 * scale, 8 * scale);
    p.fill(branch.budTone[0], branch.budTone[1], branch.budTone[2], 205);
    p.circle(offset, -7 * scale, 5.5 * scale);
  }
  p.pop();
}

function drawFlower(p, branch, x, y, angle) {
  p.push();
  p.translate(x + branch.blossomOffsetX, y - branch.blossomOffsetY);
  p.rotate(angle);
  p.noStroke();
  const size = branch.blossomSize;
  p.fill(255, 188, 203, 210);
  for (let i = 0; i < branch.blossomPetals; i += 1) {
    p.push();
    p.rotate((p.TWO_PI / branch.blossomPetals) * i);
    p.ellipse(0, -size * 0.55, size * 0.72, size * 1.1);
    p.pop();
  }
  p.fill(255, 235, 238, 220);
  p.circle(0, 0, size * 0.92);
  p.fill(242, 194, 100, 220);
  p.circle(0, 0, size * 0.38);
  p.fill(255, 255, 255, 92);
  p.circle(-size * 0.16, -size * 0.16, size * 0.18);
  p.pop();
}
