import { distance2D } from "../utils/math.js";
import { ScalarSmoother } from "./smoothing.js";

export class GestureDetector {
  constructor(config) {
    this.config = config;
    this.ratioSmoother = new ScalarSmoother(config.pinchSmoothingAlpha);
    this.isPinching = false;
  }

  update(handPoints) {
    if (!handPoints) {
      const wasPinching = this.isPinching;
      this.isPinching = false;
      this.ratioSmoother.reset();
      return {
        pinchRatio: null,
        isPinching: false,
        pinchJustStarted: false,
        pinchJustEnded: wasPinching
      };
    }

    const pinchDistance = distance2D(handPoints.indexTip, handPoints.thumbTip);
    const handScale = distance2D(handPoints.wrist, handPoints.middleMCP);
    const rawRatio = handScale > 0.001 ? pinchDistance / handScale : null;
    const pinchRatio = this.ratioSmoother.update(rawRatio);
    const wasPinching = this.isPinching;

    if (!this.isPinching && pinchRatio != null && pinchRatio < this.config.pinchEnterThreshold) {
      this.isPinching = true;
    } else if (
      this.isPinching &&
      pinchRatio != null &&
      pinchRatio > this.config.pinchReleaseThreshold
    ) {
      this.isPinching = false;
    }

    return {
      pinchRatio,
      isPinching: this.isPinching,
      pinchJustStarted: !wasPinching && this.isPinching,
      pinchJustEnded: wasPinching && !this.isPinching
    };
  }
}
