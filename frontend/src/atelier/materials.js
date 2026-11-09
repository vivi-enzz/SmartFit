export function fabricSpec(id) {
  return (
    {
      silk: { roughness: 0.28, sheen: 0.85, bump: 0.0009, anisotropy: 0.6 },
      linen: { roughness: 0.76, sheen: 0.15, bump: 0.005, anisotropy: 0 },
      cotton: { roughness: 0.63, sheen: 0.23, bump: 0.0028, anisotropy: 0 },
      wool: { roughness: 0.94, sheen: 0.78, bump: 0.006, anisotropy: 0 },
    }[id] || { roughness: 0.7, sheen: 0.2, bump: 0.003, anisotropy: 0 }
  );
}
export function createTextile(T, id) {
  const n = 128,
    color = new Uint8Array(n * n * 4),
    bump = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4,
        noise = Math.sin(x * 91.17 + y * 37.33) * 43758.54,
        grain = noise - Math.floor(noise);
      let h;
      if (id === 'silk') h = 128 + 13 * Math.sin((x * Math.PI) / 2) + grain * 4;
      else if (id === 'wool')
        h = 90 + 60 * Math.sin(x * 0.8 + y * 0.45) * Math.sin(y * 1.2) + grain * 65;
      else if (id === 'linen')
        h = 100 + 55 * (Math.cos((x * Math.PI) / 2) * Math.cos((y * Math.PI) / 2)) + grain * 35;
      else h = 128 + 35 * Math.sin((x * Math.PI) / 2) * Math.cos((y * Math.PI) / 2) + grain * 15;
      const v = Math.max(0, Math.min(255, Math.round(h))),
        c = 220 + Math.round((v - 128) * 0.15);
      for (let k = 0; k < 3; k++) {
        color[i + k] = c;
        bump[i + k] = v;
      }
      color[i + 3] = bump[i + 3] = 255;
    }
  const make = (data) => {
    const t = new T.DataTexture(data, n, n, T.RGBAFormat);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(7, 9);
    t.magFilter = T.LinearFilter;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  };
  return { color: make(color), bump: make(bump) };
}
export function fabricMaterial(T, id, color, cache) {
  if (!cache.has(id)) cache.set(id, createTextile(T, id));
  const tex = cache.get(id),
    spec = fabricSpec(id);
  return new T.MeshPhysicalMaterial({
    color,
    map: tex.color,
    bumpMap: tex.bump,
    bumpScale: spec.bump,
    roughness: spec.roughness,
    metalness: 0,
    sheen: spec.sheen,
    sheenColor: new T.Color(color),
    side: T.DoubleSide,
    anisotropy: spec.anisotropy,
    clearcoat: id === 'silk' ? 0.1 : 0,
  });
}
