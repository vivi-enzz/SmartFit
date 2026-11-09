import { bodyScale } from '../model.js';
export function createMannequin(T, metrics = {}) {
  const s = bodyScale(metrics),
    g = new T.Group();
  g.name = 'atelier-dress-form';
  const ivory = new T.MeshPhysicalMaterial({
    color: '#ded8cf',
    roughness: 0.74,
    metalness: 0.02,
    clearcoat: 0.05,
  });
  const part = (name, geometry, x, y, z = 0, scale) => {
    const o = new T.Mesh(geometry, ivory);
    o.name = name;
    o.position.set(x, y, z);
    if (scale) o.scale.set(...scale);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
    return o;
  };
  part('featureless-head', new T.SphereGeometry(1, 48, 40), 0, 1.81, 0, [0.108, 0.15, 0.1]);
  part('neck', new T.CylinderGeometry(0.052, 0.065, 0.13, 40), 0, 1.63);
  const points = [
    [0.185, 0.93],
    [0.205, 1.0],
    [0.145, 1.18],
    [0.181, 1.38],
    [0.185, 1.48],
    [0.13, 1.53],
    [0.065, 1.56],
  ].map(([r, y]) => new T.Vector2(r * (y < 1.1 ? s.hip : y < 1.3 ? s.waist : s.bust), y));
  const torso = part('smooth-torso', new T.LatheGeometry(points, 96), 0, 0, 0.012);
  torso.scale.z = 0.72;
  for (const side of [-1, 1]) {
    const arm = new T.CatmullRomCurve3([
      new T.Vector3(side * 0.195, 1.48, 0.01),
      new T.Vector3(side * 0.265, 1.34, 0.02),
      new T.Vector3(side * 0.3, 1.16, 0.03),
      new T.Vector3(side * 0.315, 1.04, 0.035),
    ]);
    part('smooth-arm', new T.TubeGeometry(arm, 48, 0.041, 24, false), 0, 0);
    part('shoulder', new T.SphereGeometry(0.061, 32, 24), side * 0.198, 1.47, 0.01);
    part(
      'hand-form',
      new T.SphereGeometry(1, 32, 24),
      side * 0.317,
      0.995,
      0.04,
      [0.035, 0.075, 0.025]
    );
    part('leg-form', new T.CapsuleGeometry(0.061, 0.7, 14, 28), side * 0.09, 0.49, 0, [1, 1, 0.82]);
    part(
      'foot-form',
      new T.SphereGeometry(1, 28, 20),
      side * 0.09,
      0.065,
      0.045,
      [0.065, 0.042, 0.12]
    );
  }
  g.scale.y = s.height;
  return g;
}
