<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import GarmentArt from './GarmentArt.vue';
import Icon from './Icon.vue';
import { bodyScale } from '../model';
const props = defineProps({ config: Object, metrics: Object });
const host = ref(null),
  fallback = ref(false),
  rotating = ref(
    typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ),
  angle = ref(0);
let THREE,
  scene,
  camera,
  renderer,
  controls,
  model,
  frame,
  observer,
  active = true,
  paint = () => {};
function disposeGroup(g) {
  if (!g) return;
  g.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
    }
  });
  scene.remove(g);
}
function rebuild() {
  if (!THREE || !scene || !active) return;
  disposeGroup(model);
  model = new THREE.Group();
  const c = props.config,
    s = bodyScale(props.metrics),
    skin = new THREE.MeshStandardMaterial({ color: '#d3bdab', roughness: 0.85 }),
    cloth = new THREE.MeshStandardMaterial({
      color: c.colorHex,
      roughness: c.fabricId === 'silk' ? 0.3 : 0.9,
      metalness: c.fabricId === 'silk' ? 0.12 : 0,
      side: THREE.DoubleSide,
    });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    o.castShadow = true;
    model.add(o);
    return o;
  };
  mesh(new THREE.SphereGeometry(0.15, 28, 24), skin, 0, 1.81).scale.set(1, 1.2, 0.92);
  mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.12, 20), skin, 0, 1.61);
  mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.4, 24), skin, 0, 1.35).scale.z = 0.65;
  for (const side of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.067, 0.045, 0.72, 20), skin, side * 0.1, 0.43).rotation.z =
      side * 0.025;
    mesh(new THREE.SphereGeometry(0.07, 16, 12), skin, side * 0.1, 0.07, 0.04).scale.set(
      0.85,
      0.6,
      1.7
    );
    const arm = mesh(new THREE.CylinderGeometry(0.048, 0.035, 0.6, 20), skin, side * 0.265, 1.23);
    arm.rotation.z = side * 0.15;
  }
  const skirtBottom =
    c.garmentType === 'top'
      ? 1.05
      : c.length === 'short'
        ? 0.76
        : c.length === 'maxi'
          ? 0.19
          : 0.47;
  const bottomRadius = c.silhouette === 'A-line' ? 0.4 : c.silhouette === 'fitted' ? 0.23 : 0.29;
  const points = [
    new THREE.Vector2(bottomRadius * s.hip, skirtBottom),
    new THREE.Vector2(c.silhouette === 'A-line' ? 0.3 * s.hip : 0.23 * s.hip, 0.98),
    new THREE.Vector2(0.155 * s.waist, 1.21),
    new THREE.Vector2(0.205 * s.bust, 1.43),
    new THREE.Vector2(0.21 * s.bust, 1.54),
  ];
  if (c.garmentType === 'top') points.splice(1, 1);
  const garment = mesh(new THREE.LatheGeometry(points, 64), cloth);
  garment.scale.z = 0.69;
  // Shoulder panels preserve a visible neckline while leaving the neck open.
  for (const side of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.14, 0.035, 0.19), cloth, side * 0.145, 1.54).rotation.z =
      side * 0.14;
    if (c.sleeve !== 'sleeveless') {
      const sleeve = mesh(
        new THREE.CylinderGeometry(0.078, 0.071, c.sleeve === 'long' ? 0.52 : 0.19, 28),
        cloth,
        side * (c.sleeve === 'long' ? 0.264 : 0.235),
        c.sleeve === 'long' ? 1.3 : 1.46
      );
      sleeve.rotation.z = side * 0.15;
    }
  }
  const neckColor = new THREE.MeshStandardMaterial({ color: '#d3bdab' });
  if (c.collar === 'v-neck') {
    const shape = new THREE.Shape();
    shape.moveTo(-0.085, 1.555);
    shape.lineTo(0.085, 1.555);
    shape.lineTo(0, 1.4);
    shape.closePath();
    mesh(new THREE.ShapeGeometry(shape), neckColor, 0, 0, 0.145);
  } else if (c.collar === 'square')
    mesh(new THREE.BoxGeometry(0.14, 0.085, 0.018), neckColor, 0, 1.52, 0.14);
  else
    mesh(new THREE.SphereGeometry(0.075, 20, 12), neckColor, 0, 1.55, 0.08).scale.set(1, 0.5, 0.75);
  if (c.embroidery !== 'none') {
    const emat = new THREE.MeshStandardMaterial({
      color: '#ead4a3',
      metalness: 0.3,
      roughness: 0.6,
    });
    if (c.embroidery === 'floral') {
      for (let i = 0; i < 5; i++) {
        const t = (i * Math.PI * 2) / 5;
        mesh(
          new THREE.SphereGeometry(0.012, 10, 8),
          emat,
          0.1 + Math.cos(t) * 0.016,
          1.39 + Math.sin(t) * 0.016,
          0.15
        );
      }
    } else {
      mesh(new THREE.BoxGeometry(0.004, 0.04, 0.006), emat, 0.1, 1.39, 0.15);
      mesh(new THREE.BoxGeometry(0.025, 0.004, 0.006), emat, 0.11, 1.41, 0.15);
    }
  }
  model.scale.y = s.height;
  model.rotation.y = (angle.value * Math.PI) / 180;
  scene.add(model);
  paint();
}
onMounted(async () => {
  try {
    THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    if (!active) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e5db');
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(2.7, 1.6, 4.5);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.setAttribute('aria-label', '三维服装模型，可拖动旋转');
    renderer.domElement.setAttribute('role', 'img');
    host.value.appendChild(renderer.domElement);
    renderer.domElement.addEventListener(
      'webglcontextlost',
      () => {
        fallback.value = true;
      },
      { once: true }
    );
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enablePan = false;
    controls.minDistance = 2.8;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.65;
    controls.update();
    scene.add(new THREE.HemisphereLight('#fff9ed', '#889a88', 3));
    const light = new THREE.DirectionalLight('#ffffff', 3);
    light.position.set(3, 5, 4);
    light.castShadow = true;
    scene.add(light);
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.63, 0.66, 0.04, 64),
      new THREE.MeshStandardMaterial({ color: '#d7d0c2', roughness: 1 })
    );
    floor.position.y = 0.025;
    floor.receiveShadow = true;
    scene.add(floor);
    observer = new ResizeObserver(() => {
      if (!host.value) return;
      const w = host.value.clientWidth,
        h = host.value.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(host.value);
    paint = () => renderer.render(scene, camera);
    rebuild();
    const animate = () => {
      if (!active) return;
      frame = requestAnimationFrame(animate);
      if (model && rotating.value) model.rotation.y += 0.003;
      controls.update();
      paint();
    };
    animate();
  } catch {
    fallback.value = true;
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
  disposeGroup(model);
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
      <span class="live-dot"></span>{{ fallback ? '二维预览' : '3D 虚拟试衣间'
      }}<span class="pill">造型参考</span>
    </div>
    <div v-show="!fallback" ref="host" class="webgl-host"></div>
    <GarmentArt v-if="fallback" :config="config" />
    <div v-if="!fallback" class="room-controls">
      <button class="secondary small" @click="rotating = !rotating">
        <Icon name="rotate" :size="16" />{{ rotating ? '暂停旋转' : '自动旋转' }}</button
      ><label v-if="!fallback" class="rotation-label"
        >角度<input
          v-model.number="angle"
          type="range"
          min="-180"
          max="180"
          aria-label="模型旋转角度"
      /></label>
    </div>
    <p class="room-note">
      {{ fallback ? '二维预览仅展示服装参数，不展示身体尺寸' : '拖动旋转 · 滚轮缩放' }} ·
      预览不代表真实成衣合体效果
    </p>
  </div>
</template>
