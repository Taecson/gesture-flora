export function mapNormalizedPoint(point, width, height, mirror = true) {
  if (!point) return null;
  const x = mirror ? (1 - point.x) * width : point.x * width;
  return {
    x,
    y: point.y * height,
    z: point.z ?? 0
  };
}

export function isDrawingPoint(point, topMargin) {
  return Boolean(point && point.y > topMargin);
}
