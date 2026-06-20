export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

export function distance2D(a, b) {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function angleBetweenPoints(a, b) {
  if (!a || !b) return 0;
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function signedRandom(amount) {
  return randomRange(-amount, amount);
}

export function clonePoint(point) {
  return point ? { x: point.x, y: point.y, z: point.z ?? 0 } : null;
}
