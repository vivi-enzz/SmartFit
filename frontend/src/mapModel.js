export const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const centers = {
  'Hong Kong': [22.2855, 114.1635],
  Shanghai: [31.2304, 121.4737],
  Beijing: [39.9042, 116.4074],
  Shenzhen: [22.5431, 114.0579],
};
export const mapCenter = (city) => [...(centers[city] || centers['Hong Kong'])];
export const mapPoints = (partners) =>
  (partners || [])
    .filter(
      (p) =>
        typeof p.lat === 'number' &&
        typeof p.lon === 'number' &&
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lon) &&
        Math.abs(p.lat) <= 90 &&
        Math.abs(p.lon) <= 180
    )
    .map((p) => ({ ...p, coordinates: [p.lat, p.lon] }));
export const mapLink = ([lat, lon], zoom = 13) =>
  `https://www.openstreetmap.org/#map=${zoom}/${Number(lat).toFixed(5)}/${Number(lon).toFixed(5)}`;
