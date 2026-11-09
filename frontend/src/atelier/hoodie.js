import { fabricMaterial } from './materials.js';
export function addHoodieDetails(T, group, c, scale, textures) {
  const cloth = fabricMaterial(T, c.fabricId, c.colorHex, textures);
  const rib = cloth.clone();
  rib.roughness = Math.min(1, cloth.roughness + 0.12);
  rib.bumpScale *= 1.7;
  const thread = new T.MeshStandardMaterial({ color: '#e9e4db', roughness: 0.8 });
  const mesh = (name, geo, mat, x = 0, y = 0, z = 0) => {
    const o = new T.Mesh(geo, mat);
    o.name = name;
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    group.add(o);
    return o;
  };
  const positions = [],
    uv = [],
    idx = [],
    rows = 44,
    cols = 64;
  for (let j = 0; j <= rows; j++) {
    const theta = 0.08 + (Math.PI * 0.86 * j) / rows;
    for (let i = 0; i <= cols; i++) {
      const a = 0.68 + ((Math.PI * 2 - 1.36) * i) / cols;
      positions.push(
        Math.sin(a) * 0.168 * Math.sin(theta),
        (1.715 + 0.221 * Math.cos(theta)) * scale.height,
        -0.022 + Math.cos(a) * 0.18 * Math.sin(theta)
      );
      uv.push(i / cols, j / rows);
    }
  }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i,
        b = a + cols + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const hood = new T.BufferGeometry();
  hood.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  hood.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  hood.setIndex(idx);
  hood.computeVertexNormals();
  mesh('hood-shell', hood, cloth);
  const tube = (name, points, r, mat) =>
    mesh(
      name,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p[0], p[1] * scale.height, p[2]))),
        64,
        r,
        8,
        false
      ),
      mat
    );
  for (const side of [-1, 1]) {
    tube(
      'hood-drawstring',
      [
        [side * 0.08, 1.525, 0.175],
        [side * 0.074, 1.46, 0.209],
        [side * 0.09, 1.31, 0.206],
        [side * 0.083, 1.28, 0.208],
      ],
      0.0026,
      thread
    );
    const cuff = mesh(
      'ribbed-cuff',
      new T.CylinderGeometry(0.049, 0.047, 0.065, 48, 12, true),
      rib,
      side * 0.315,
      1.06 * scale.height,
      0.035
    );
    cuff.rotation.z = side * 0.08;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      tube(
        'cuff-rib',
        [
          [side * 0.315 + Math.sin(a) * 0.049, 1.029, 0.035 + Math.cos(a) * 0.049],
          [side * 0.315 + Math.sin(a) * 0.049, 1.09, 0.035 + Math.cos(a) * 0.049],
        ],
        0.0007,
        cloth
      );
    }
  }
  const hem = mesh(
    'ribbed-hem',
    new T.CylinderGeometry(0.24 * scale.hip, 0.233 * scale.hip, 0.07 * scale.height, 80, 8, true),
    rib,
    0,
    1.055 * scale.height,
    0.025
  );
  hem.scale.z = 0.76;
  // Curved patch pocket follows the chest rather than floating in front of it.
  const pocket = new T.BufferGeometry(),
    p = [],
    t = [],
    indices = [],
    nr = 20,
    nc = 32;
  for (let j = 0; j <= nr; j++) {
    const y = 1.105 + (j / nr) * 0.145;
    const w = 0.128 - (j / nr) * 0.035;
    for (let i = 0; i <= nc; i++) {
      const x = -w + (2 * w * i) / nc;
      const r = 0.239 * scale.waist;
      p.push(x, y * scale.height, Math.sqrt(Math.max(0.01, r * r - x * x)) * 0.76 + 0.035);
      t.push(i / nc, j / nr);
    }
  }
  for (let j = 0; j < nr; j++)
    for (let i = 0; i < nc; i++) {
      const a = j * (nc + 1) + i,
        b = a + nc + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  pocket.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  pocket.setAttribute('uv', new T.Float32BufferAttribute(t, 2));
  pocket.setIndex(indices);
  pocket.computeVertexNormals();
  mesh('kangaroo-pocket', pocket, cloth);
  for (const side of [-1, 1])
    tube(
      'pocket-stitch',
      [
        [side * 0.093, 1.249, 0.208],
        [side * 0.11, 1.19, 0.206],
        [side * 0.128, 1.107, 0.19],
      ],
      0.0013,
      thread
    );
}
