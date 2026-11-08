<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import GarmentArt from './GarmentArt.vue';
import Icon from './Icon.vue';
import { bodyScale } from '../model';
import { deformBodyPosition, necklineY } from '../avatarShape';
const props = defineProps({ config: Object, metrics: Object });
const host = ref(null),
  fallback = ref(false),
  loading = ref(true),
  rotating = ref(false),
  angle = ref(0);
let THREE,
  scene,
  camera,
  renderer,
  controls,
  model,
  frame,
  observer,
  bodyGeometry,
  active = true,
  texture;
const skinColor = '#b98e75';
function dispose(g) {
  if (!g) return;
  g.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
    }
  });
  scene?.remove(g);
}
function rebuild() {
  if (!THREE || !scene || !bodyGeometry || !active) return;
  const rotation = model?.rotation.y ?? (angle.value * Math.PI) / 180;
  dispose(model);
  model = new THREE.Group();
  const c = props.config,
    s = bodyScale(props.metrics);
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    model.add(o);
    return o;
  };
  const geometry = bodyGeometry.clone(),
    pos = geometry.attributes.position,
    colors = [];
  const skin = new THREE.Color(skinColor),
    pants = new THREE.Color('#25282c');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const p = deformBodyPosition([x, y, z], props.metrics);
    pos.setXYZ(i, ...p);
    const color = y < 1.055 ? pants : skin;
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.66,
      metalness: 0,
      sheen: 0.12,
      sheenColor: new THREE.Color('#e2b69b'),
    })
  );
  const hair = new THREE.MeshStandardMaterial({ color: '#241a18', roughness: 0.7 });
  const hairGroup = new THREE.Group();
  model.add(hairGroup);
  const hairMesh = (geo, x, y, z) => {
    const o = new THREE.Mesh(geo, hair);
    o.position.set(x, y * s.height, z);
    o.castShadow = true;
    hairGroup.add(o);
    return o;
  };
  hairMesh(
    new THREE.SphereGeometry(0.109, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.53),
    0,
    1.866,
    0.065
  ).scale.set(1, 1.03 * s.height, 1.02);
  hairMesh(new THREE.SphereGeometry(0.068, 32, 24), 0, 1.848, -0.072).scale.set(
    1,
    1.17 * s.height,
    0.85
  );
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.06, 1.937, 0.075),
      new THREE.Vector3(side * 0.102, 1.87, 0.065),
      new THREE.Vector3(side * 0.101, 1.78, 0.007),
      new THREE.Vector3(side * 0.074, 1.75, -0.033),
    ]);
    const o = hairMesh(new THREE.TubeGeometry(curve, 32, 0.016, 8, false), 0, 0, 0);
    o.scale.y = s.height;
  }
  const eyeWhite = new THREE.MeshStandardMaterial({ color: '#e8ded5', roughness: 0.45 }),
    iris = new THREE.MeshStandardMaterial({ color: '#3d3029', roughness: 0.35 });
  for (const side of [-1, 1]) {
    mesh(
      new THREE.SphereGeometry(0.016, 24, 16),
      eyeWhite,
      side * 0.04,
      1.834 * s.height,
      0.165
    ).scale.set(1, 0.55, 0.7);
    mesh(
      new THREE.SphereGeometry(0.0065, 20, 16),
      iris,
      side * 0.04,
      1.834 * s.height,
      0.178
    ).scale.set(1, 1, 0.45);
    const brow = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.024, 1.857 * s.height, 0.155),
      new THREE.Vector3(side * 0.043, 1.862 * s.height, 0.157),
      new THREE.Vector3(side * 0.059, 1.855 * s.height, 0.15),
    ]);
    mesh(new THREE.TubeGeometry(brow, 12, 0.0025, 6, false), hair);
  }
  const lip = new THREE.MeshStandardMaterial({ color: '#9b615c', roughness: 0.7 });
  mesh(new THREE.SphereGeometry(0.025, 24, 12), lip, 0, 1.758 * s.height, 0.173).scale.set(
    1,
    0.17,
    0.17
  );
  const cloth = new THREE.MeshPhysicalMaterial({
    color: c.colorHex,
    roughness: c.fabricId === 'silk' ? 0.34 : c.fabricId === 'wool' ? 0.94 : 0.78,
    metalness: 0,
    sheen: c.fabricId === 'silk' ? 0.7 : 0.24,
    sheenColor: new THREE.Color(c.colorHex),
    side: THREE.DoubleSide,
    clearcoat: c.fabricId === 'silk' ? 0.12 : 0,
    bumpMap: texture,
    bumpScale: c.fabricId === 'silk' ? 0.001 : 0.003,
  });
  const bottom =
    c.garmentType === 'top'
      ? 1.045
      : c.length === 'short'
        ? 0.78
        : c.length === 'maxi'
          ? 0.19
          : 0.48;
  const radius = c.silhouette === 'A-line' ? 0.39 : c.silhouette === 'fitted' ? 0.225 : 0.285;
  const points = [
    new THREE.Vector2(radius * s.hip, bottom),
    new THREE.Vector2(((radius + 0.19) / 2) * s.hip, (bottom + 1.16) / 2),
    new THREE.Vector2(0.19 * s.waist, 1.2),
    new THREE.Vector2(0.234 * s.bust, 1.43),
    new THREE.Vector2(0.22 * s.bust, 1.555),
  ];
  if (c.garmentType === 'top') points.splice(1, 1);
  const dense = [];
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = 0; j < 20; j++) dense.push(points[i].clone().lerp(points[i + 1], j / 20));
  }
  dense.push(points.at(-1));
  const geo = new THREE.LatheGeometry(dense, 128);
  const gp = geo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i),
      y = gp.getY(i),
      z = gp.getZ(i),
      a = Math.atan2(z, x),
      pleat = Math.sin(a * 14) * 0.003 * (1 - Math.min(1, y / 1.2));
    gp.setXYZ(i, x * (1 + pleat), necklineY(x / s.bust, z, y, c.collar), z * (1 + pleat));
  }
  geo.computeVertexNormals();
  mesh(geo, cloth, 0, 0, 0.04).scale.set(1, s.height, 0.87);
  for (const side of [-1, 1]) {
    mesh(
      new THREE.BoxGeometry(0.14, 0.022, 0.225),
      cloth,
      side * 0.155,
      1.55 * s.height,
      0.033
    ).rotation.z = side * 0.13;
    if (c.sleeve !== 'sleeveless') {
      const long = c.sleeve === 'long',
        sleeve = mesh(
          new THREE.CylinderGeometry(0.083, long ? 0.058 : 0.075, long ? 0.53 : 0.2, 40),
          cloth,
          side * (long ? 0.285 : 0.252),
          (long ? 1.3 : 1.46) * s.height,
          0.025
        );
      sleeve.rotation.z = side * 0.12;
      sleeve.scale.y = s.height;
    }
  }
  // The neckline is formed by the actual garment mesh, not a painted skin overlay.
  const seam = new THREE.MeshStandardMaterial({ color: c.colorHex, roughness: 0.8 });
  const belt = mesh(
    new THREE.TorusGeometry(0.19 * s.waist, 0.003, 8, 96),
    seam,
    0,
    1.2 * s.height,
    0.04
  );
  belt.rotation.x = Math.PI / 2;
  belt.scale.y = 0.87;
  if (c.embroidery !== 'none') {
    const em = new THREE.MeshStandardMaterial({ color: '#d7b975', metalness: 0.3, roughness: 0.5 });
    if (c.embroidery === 'floral') {
      for (let i = 0; i < 6; i++) {
        const t = (i * Math.PI) / 3;
        mesh(
          new THREE.SphereGeometry(0.008, 12, 8),
          em,
          0.1 + Math.cos(t) * 0.012,
          (1.4 + Math.sin(t) * 0.012) * s.height,
          0.231
        );
      }
    } else {
      mesh(new THREE.BoxGeometry(0.003, 0.03, 0.004), em, 0.1, 1.4 * s.height, 0.231);
      mesh(new THREE.BoxGeometry(0.021, 0.003, 0.004), em, 0.109, 1.414 * s.height, 0.231);
    }
  }
  model.rotation.y = rotation;
  scene.add(model);
}
onMounted(async () => {
  try {
    THREE = await import('three');
    const [{ OrbitControls }, { GLTFLoader }] = await Promise.all([
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/loaders/GLTFLoader.js'),
    ]);
    if (!active) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#f1f1f1');
    camera = new THREE.PerspectiveCamera(29, 1, 0.1, 50);
    camera.position.set(0, 1.23, 4.55);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', '3D 數字模特，可拖動旋轉');
    renderer.domElement.setAttribute('role', 'img');
    host.value.appendChild(renderer.domElement);
    renderer.domElement.addEventListener(
      'webglcontextlost',
      () => {
        fallback.value = true;
        loading.value = false;
      },
      { once: true }
    );
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.06, 0.03);
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI * 0.6;
    controls.minPolarAngle = Math.PI * 0.27;
    controls.enableDamping = true;
    controls.update();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b8b2ac', 2.5));
    const key = new THREE.DirectionalLight('#fff4ea', 4.0);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -1.5;
    key.shadow.camera.right = 1.5;
    key.shadow.camera.top = 2.5;
    key.shadow.camera.bottom = -0.5;
    key.shadow.bias = -0.0003;
    scene.add(key);
    const fill = new THREE.DirectionalLight('#e9eeff', 1.4);
    fill.position.set(-3, 2, 1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight('#ffffff', 2.2);
    rim.position.set(1, 3, -2);
    scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 96),
      new THREE.MeshStandardMaterial({ color: '#ededed', roughness: 0.96 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.006;
    floor.receiveShadow = true;
    scene.add(floor);
    const pixels = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 128; x++) {
        const i = (y * 128 + x) * 4,
          v =
            155 +
            Math.round(
              35 * Math.sin(x * Math.PI) * Math.sin(y * 0.8) + 25 * Math.sin(x * 1.7 + y * 0.3)
            );
        pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
        pixels[i + 3] = 255;
      }
    texture = new THREE.DataTexture(pixels, 128, 128, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.needsUpdate = true;
    observer = new ResizeObserver(() => {
      if (!host.value || !active) return;
      const w = host.value.clientWidth,
        h = host.value.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(host.value);
    const asset = await new GLTFLoader().loadAsync('/models/atelier-body.glb');
    if (!active) {
      asset.scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose?.();
      });
      return;
    }
    asset.scene.traverse((o) => {
      if (o.isMesh && !bodyGeometry) bodyGeometry = o.geometry;
    });
    if (!bodyGeometry) throw Error('Missing model');
    loading.value = false;
    rebuild();
    const animate = () => {
      if (!active) return;
      frame = requestAnimationFrame(animate);
      if (model && rotating.value) model.rotation.y += 0.003;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  } catch {
    fallback.value = true;
    loading.value = false;
    renderer?.dispose();
  }
});
watch(() => [props.config, props.metrics], rebuild, { deep: true });
watch(angle, () => {
  if (model) model.rotation.y = (angle.value * Math.PI) / 180;
});
onBeforeUnmount(() => {
  active = false;
  cancelAnimationFrame(frame);
  observer?.disconnect();
  controls?.dispose();
  dispose(model);
  bodyGeometry?.dispose();
  texture?.dispose();
  scene?.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose?.();
  });
  renderer?.dispose();
});
</script>
<template>
  <div class="fitting-room">
    <div class="room-label">
      <span class="live-dot"></span>{{ $t(fallback ? '2D 造型預覽' : 'THE VIRTUAL ATELIER')
      }}<span class="pill">3D FIT STUDIO</span>
    </div>
    <div v-if="loading" class="model-loading">
      <div></div>
      <p>{{ $t('正在準備你的數字模特…') }}</p>
    </div>
    <div v-show="!fallback" ref="host" class="webgl-host"></div>
    <GarmentArt v-if="fallback" :config="config" />
    <div v-if="!fallback && !loading" class="model-view-tabs">
      <button @click="angle = 0">{{ $t('正面') }}</button
      ><button @click="angle = 90">{{ $t('側面') }}</button
      ><button @click="angle = 180">{{ $t('背面') }}</button>
    </div>
    <div v-if="!fallback && !loading" class="room-controls">
      <button class="secondary small" @click="rotating = !rotating">
        <Icon name="rotate" :size="16" />{{ $t(rotating ? '暫停旋轉' : '360° 旋轉') }}</button
      ><label class="rotation-label"
        >{{ $t('角度')
        }}<input
          v-model.number="angle"
          type="range"
          min="-180"
          max="180"
          :aria-label="$t('模特旋轉角度')"
      /></label>
    </div>
    <p class="room-note">
      {{ $t(fallback ? '2D 預覽僅展示服裝參數' : '拖動旋轉 · 滾輪縮放')
      }}{{ $t('· 造型參考，非真實合體預測') }}
    </p>
  </div>
</template>
