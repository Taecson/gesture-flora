import { BrushBase } from "./BrushBase.js";
import { randomInt, randomRange, signedRandom } from "../utils/math.js";

export class GrassBrush extends BrushBase {
  emit(point, tangent, context) {
    const blades = Array.from({ length: randomInt(4, 8) }, () => ({
      offset: signedRandom(10),
      height: randomRange(14, 38),
      lean: signedRandom(0.58),
      width: randomRange(1, 2.6),
      shade: randomRange(0, 1),
      seedHead: Math.random() > 0.78,
      layer: Math.random() > 0.55 ? 1 : 0
    }));

    this.addElement({
      x: point.x,
      y: point.y,
      angle: tangent - Math.PI / 2 + signedRandom(0.35),
      baseSpread: randomRange(2, 7),
      blades,
      strokeId: context.strokeId
    });
  }

  draw(p) {
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND);
    for (const tuft of this.elements) {
      for (const blade of tuft.blades) {
        const baseX = tuft.x + Math.cos(tuft.angle + Math.PI / 2) * blade.offset + signedLayerOffset(blade.layer, tuft.baseSpread);
        const baseY = tuft.y + Math.sin(tuft.angle + Math.PI / 2) * blade.offset + blade.layer * 2;
        const tipAngle = tuft.angle + blade.lean;
        const tipX = baseX + Math.cos(tipAngle) * blade.height;
        const tipY = baseY + Math.sin(tipAngle) * blade.height;
        const ctrlX1 = baseX + Math.cos(tuft.angle + blade.lean * 0.2) * blade.height * 0.34;
        const ctrlY1 = baseY + Math.sin(tuft.angle + blade.lean * 0.2) * blade.height * 0.34;
        const ctrlX2 = baseX + Math.cos(tipAngle + blade.lean * 0.35) * blade.height * 0.72;
        const ctrlY2 = baseY + Math.sin(tipAngle + blade.lean * 0.35) * blade.height * 0.72;

        p.stroke(42 + blade.shade * 36, 120 + blade.height * 2.2, 62 + blade.shade * 42, 170 + blade.layer * 30);
        p.strokeWeight(blade.width);
        p.bezier(baseX, baseY, ctrlX1, ctrlY1, ctrlX2, ctrlY2, tipX, tipY);

        p.stroke(214, 255, 203, 48);
        p.strokeWeight(Math.max(0.6, blade.width * 0.35));
        p.line(baseX, baseY, tipX, tipY);

        if (blade.seedHead) {
          p.noStroke();
          p.fill(206, 197, 116, 145);
          p.ellipse(tipX, tipY, 3.8, 8.5);
          p.fill(242, 226, 145, 110);
          p.circle(tipX - 1.2, tipY - 2.2, 2.2);
          p.noFill();
        }
      }
    }
    p.pop();
  }
}

function signedLayerOffset(layer, spread) {
  return layer ? spread * 0.3 : -spread * 0.2;
}
