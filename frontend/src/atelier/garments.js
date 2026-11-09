import { bodyScale } from '../model.js';
import { necklineY } from '../avatarShape.js';
import { normalizeDesignConfig } from '../../../shared/catalog.js';
import { fabricMaterial } from './materials.js';
export function createGarments(T, input, metrics = {}, textures = new Map()) {
  const c = normalizeDesignConfig(input),
    s = bodyScale(metrics),
    g = new T.Group();
  g.name = 'garment-assembly';
  const cloth = fabricMaterial(T, c.fabricId, c.colorHex, textures);
  const seamMat = new T.MeshStandardMaterial({
    color: new T.Color(c.colorHex).multiplyScalar(0.72),
    roughness: 0.85,
  });
  const bottom =
    c.garmentType === 'top'
      ? 1.045
      : c.length === 'short'
        ? 0.77
        : c.length === 'maxi'
          ? 0.22
          : 0.49;
  const hem = c.silhouette === 'A-line' ? 0.365 : c.silhouette === 'fitted' ? 0.215 : 0.275;
  const radius = (y) => {
    const profile = [
      [bottom, hem * s.hip],
      [0.98, 0.235 * s.hip],
      [1.19, 0.168 * s.waist],
      [1.39, 0.205 * s.bust],
      [1.535, 0.207 * s.bust],
    ].filter((p, i) => i === 0 || p[0] > bottom);
    for (let i = 0; i < profile.length - 1; i++)
      if (y <= profile[i + 1][0]) {
        const t = Math.max(0, (y - profile[i][0]) / (profile[i + 1][0] - profile[i][0]));
        return profile[i][1] * (1 - t) + profile[i + 1][1] * t;
      }
    return profile.at(-1)[1];
  };
  const put = (name, geometry, material, x = 0, y = 0, z = 0) => {
    const o = new T.Mesh(geometry, material);
    o.name = name;
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
    return o;
  };
  const surface = (
    name,
    lo,
    hi,
    material,
    { offset = 0, start = 0, span = Math.PI * 2, pleated = false, tier = false } = {}
  ) => {
    const positions = [],
      uv = [],
      indices = [],
      rows = 70,
      cols = 112;
    for (let j = 0; j <= rows; j++) {
      const y = lo + ((hi - lo) * j) / rows;
      for (let i = 0; i <= cols; i++) {
        const a = start + (span * i) / cols;
        const fold =
          (pleated ? Math.cos(a * 24) * 0.014 * Math.max(0, (1.18 - y) / (1.18 - bottom)) : 0) +
          (tier ? Math.sin(a * 18) * 0.012 * (1 - j / rows) : 0);
        const r = radius(y) + offset + fold;
        let yy = hi > 1.4 ? necklineY((Math.sin(a) * r) / s.bust, Math.cos(a), y, c.collar) : y;
        if (c.construction === 'wrap' && y < 1.18) yy += Math.sin(a) * 0.018 * (1 - j / rows);
        positions.push(Math.sin(a) * r, yy * s.height, Math.cos(a) * r * 0.76 + 0.025);
        uv.push(i / cols, (y - bottom) / (1.535 - bottom));
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = j * (cols + 1) + i,
          b = a + cols + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return put(name, geo, material);
  };
  surface('main-garment', bottom, 1.535, cloth, { pleated: c.construction === 'pleated' });
  const line = (name, points, material = seamMat, r = 0.0014) =>
    put(
      name,
      new T.TubeGeometry(new T.CatmullRomCurve3(points), Math.max(48, points.length), r, 6, false),
      material
    );
  const rim = (name, y, offset = 0, material = seamMat) => {
    const pts = Array.from({ length: 113 }, (_, i) => {
      const a = (i / 112) * Math.PI * 2,
        r = radius(y) + offset;
      return new T.Vector3(Math.sin(a) * r, y * s.height, Math.cos(a) * r * 0.76 + 0.025);
    });
    line(name, pts, material);
  };
  function sleeves(material, long, coat = false) {
    for (const side of [-1, 1]) {
      const curve = new T.CatmullRomCurve3([
          new T.Vector3(side * 0.195, 1.48, 0.014),
          new T.Vector3(side * 0.26, 1.36, 0.02),
          new T.Vector3(side * 0.3, 1.17, 0.03),
          new T.Vector3(side * 0.315, 1.04, 0.035),
        ]),
        rows = 36,
        cols = 36,
        max = long ? 0.94 : 0.39,
        verts = [],
        uv = [],
        idx = [];
      for (let j = 0; j <= rows; j++) {
        const t = j / rows,
          p = curve.getPoint(t * max),
          tangent = curve.getTangent(t * max),
          normal = new T.Vector3(0, 0, 1).projectOnPlane(tangent).normalize(),
          binormal = new T.Vector3().crossVectors(tangent, normal).normalize();
        const r = (long ? 0.075 * (1 - t) + 0.047 * t : 0.076) + (coat ? 0.008 : 0);
        for (let i = 0; i <= cols; i++) {
          const a = (i / cols) * Math.PI * 2,
            pt = p
              .clone()
              .addScaledVector(normal, Math.cos(a) * r)
              .addScaledVector(binormal, Math.sin(a) * r);
          verts.push(pt.x, pt.y * s.height, pt.z);
          uv.push(i / cols, t);
        }
      }
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const a = j * (cols + 1) + i,
            b = a + cols + 1;
          idx.push(a, a + 1, b, b, a + 1, b + 1);
        }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      put(coat ? 'jacket-sleeve' : 'set-in-sleeve', geo, material);
      const shoulder = put(
        coat ? 'jacket-shoulder' : 'rounded-shoulder',
        new T.SphereGeometry(coat ? 0.084 : 0.075, 36, 28),
        material,
        side * 0.195,
        1.478 * s.height,
        0.014
      );
      shoulder.scale.set(1, 1.03 * s.height, 0.96);
    }
  }
  if (c.sleeve !== 'sleeveless') sleeves(cloth, c.sleeve === 'long');
  else
    for (const side of [-1, 1])
      line(
        'soft-shoulder-strap',
        [
          new T.Vector3(side * 0.135, 1.49 * s.height, 0.17),
          new T.Vector3(side * 0.145, 1.548 * s.height, 0.03),
          new T.Vector3(side * 0.135, 1.49 * s.height, -0.12),
        ],
        cloth,
        0.018
      );
  if (c.construction === 'tiered') {
    const range = 0.98 - bottom;
    for (let i = 0; i < 3; i++) {
      const hi = 0.98 - (range * i) / 3,
        lo = 0.98 - (range * (i + 1)) / 3 - 0.008;
      surface('tiered-flounce-' + i, Math.max(bottom - 0.008, lo), hi, cloth, {
        offset: 0.014 + i * 0.004,
        tier: true,
      });
      rim('tier-seam-' + i, hi, 0.016);
    }
  }
  if (c.construction === 'wrap') {
    surface('overlapping-wrap-panel', bottom + 0.012, 1.18, cloth, {
      offset: 0.012,
      start: -0.38,
      span: 1.35,
    });
    const pts = Array.from({ length: 40 }, (_, i) => {
      const y = 1.18 - ((1.18 - bottom) * i) / 39,
        a = 0.97;
      return new T.Vector3(
        Math.sin(a) * (radius(y) + 0.014),
        y * s.height,
        Math.cos(a) * (radius(y) + 0.014) * 0.76 + 0.025
      );
    });
    line('wrap-edge', pts);
  }
  rim('fine-hem', bottom + 0.006, c.construction === 'pleated' ? 0.002 : 0);
  rim('waist-stitch', 1.185, 0.003);
  if (c.layer !== 'none') {
    const outer = fabricMaterial(
        T,
        c.layer === 'cropped-jacket' ? 'wool' : 'linen',
        c.accentColor,
        textures
      ),
      lo = c.layer === 'cropped-jacket' ? 1.12 : 0.77;
    surface('outer-layer', lo, 1.555, outer, {
      offset: 0.032,
      start: 0.43,
      span: Math.PI * 2 - 0.86,
    });
    if (c.layer === 'cropped-jacket') sleeves(outer, true, true);
    for (const side of [-1, 1]) {
      const sh = new T.Shape();
      sh.moveTo(side * 0.074, 1.53 * s.height);
      sh.lineTo(side * 0.15, 1.54 * s.height);
      sh.lineTo(side * 0.115, 1.29 * s.height);
      sh.lineTo(side * 0.055, 1.38 * s.height);
      sh.closePath();
      const geo = new T.ShapeGeometry(sh, 12),
        p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const x = p.getX(k) * s.bust,
          y = p.getY(k),
          r = radius(y / s.height) + 0.033;
        p.setXYZ(k, x, y, Math.sqrt(Math.max(0.0001, r * r - x * x)) * 0.76 + 0.029);
      }
      geo.computeVertexNormals();
      put('tailored-lapel', geo, outer);
    }
    const buttons = new T.MeshStandardMaterial({
      color: '#c9b99a',
      metalness: 0.55,
      roughness: 0.4,
    });
    for (let i = 0; i < (c.layer === 'cropped-jacket' ? 2 : 3); i++)
      put(
        'coat-button',
        new T.SphereGeometry(0.007, 16, 12),
        buttons,
        0.115 * s.bust,
        (1.3 - i * 0.085) * s.height,
        Math.sqrt(Math.max(0.001, (radius(1.3 - i * 0.085) + 0.033) ** 2 - (0.115 * s.bust) ** 2)) *
          0.76 +
          0.03
      );
  }
  if (c.embroidery !== 'none') {
    const thread = new T.MeshStandardMaterial({ color: '#b69c66', roughness: 0.65 });
    const x = 0.1,
      y = 1.39 * s.height,
      z = 0.19;
    if (c.embroidery === 'floral') {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const o = put(
          'thread-petal',
          new T.SphereGeometry(0.008, 14, 10),
          thread,
          x + Math.cos(a) * 0.014,
          y + Math.sin(a) * 0.014,
          z
        );
        o.scale.z = 0.35;
      }
    } else {
      put('monogram-stem', new T.BoxGeometry(0.002, 0.026, 0.003), thread, x, y, z);
      put('monogram-bar', new T.BoxGeometry(0.018, 0.002, 0.003), thread, x + 0.008, y + 0.012, z);
    }
  }
  return g;
}
