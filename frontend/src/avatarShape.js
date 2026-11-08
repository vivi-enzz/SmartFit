import { bodyScale } from './model.js';
export function deformBodyPosition([x, y, z], metrics = {}) {
  const s = bodyScale(metrics);
  let width = 1;
  const influence = (center, spread) => Math.max(0, 1 - Math.abs(y - center) / spread);
  if (y < 1.61 && Math.abs(x) < 0.235) {
    width +=
      (s.bust - 1) * influence(1.43, 0.17) +
      (s.waist - 1) * influence(1.2, 0.16) +
      (s.hip - 1) * influence(0.97, 0.22);
  }
  return [x * width, y * s.height, (z - 0.035) * width + 0.035];
}
export function necklineY(x, z, y, collar) {
  if (z <= 0 || y <= 1.4 || Math.abs(x) >= 0.095) return y;
  const u = Math.abs(x) / 0.095;
  const drop =
    collar === 'v-neck'
      ? 0.14 * (1 - u)
      : collar === 'square'
        ? 0.08 * Math.min(1, (1 - u) * 8)
        : 0.066 * Math.sqrt(1 - u * u);
  return y - drop * Math.min(1, (y - 1.4) / 0.155);
}
