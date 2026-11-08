export { validMetrics, estimatePrice, statusLabel } from '../../shared/catalog.js';
export function bodyScale(m = {}) {
  const ratio = (k, base, min, max) =>
    Number.isFinite(m[k]) ? Math.max(min, Math.min(max, m[k] / base)) : 1;
  return {
    height: ratio('height', 168, 0.83, 1.19),
    bust: ratio('bust', 88, 0.74, 1.6),
    waist: ratio('waist', 68, 0.73, 1.92),
    hip: ratio('hip', 94, 0.74, 1.6),
  };
}
