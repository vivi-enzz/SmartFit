<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import GarmentArt from './GarmentArt.vue';
import Icon from './Icon.vue';
import { createMannequin } from '../atelier/mannequin';
import { createGarments } from '../atelier/garments';
import { bodyScale } from '../model';
const props = defineProps({
  config: Object,
  metrics: Object,
  mode: { type: String, default: 'tryon' },
});
const host = ref(null),
  fallback = ref(false),
  loading = ref(true),
  rotating = ref(false),
  angle = ref(-12),
  viewMode = ref('full');
let T,
  scene,
  camera,
  renderer,
  controls,
  model,
  frame,
  observer,
  active = true;
const textiles = new Map();
function release(group) {
  if (!group) return;
  const geometries = new Set(),
    materials = new Set();
  group.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material)
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  group.parent?.remove(group);
}
function rebuild() {
  if (!scene || !active || fallback.value) return;
  const yaw = model?.rotation.y ?? (angle.value * Math.PI) / 180;
  release(model);
  model = new T.Group();
  if (props.mode === 'tryon') model.add(createMannequin(T, props.metrics));
  model.add(createGarments(T, props.config, props.metrics, textiles));
  model.rotation.y = yaw;
  scene.add(model);
}
function cameraView() {
  if (!camera || !controls) return;
  const h = bodyScale(props.metrics).height;
  if (viewMode.value === 'fabric') {
    rotating.value = false;
    angle.value = 0;
    camera.position.set(0.1, 1.33 * h, 1.2);
    controls.target.set(0, 1.29 * h, 0.05);
    controls.minDistance = 0.65;
  } else if (viewMode.value === 'upper' || props.mode === 'garment') {
    const center =
      props.config?.garmentType === 'dress' && viewMode.value !== 'upper' ? 1.05 : 1.47;
    camera.position.set(
      0,
      center * h,
      props.config?.garmentType === 'dress' && viewMode.value !== 'upper' ? 3.9 : 2.55
    );
    controls.target.set(0, center * h, 0.025);
    controls.minDistance = 1.2;
  } else {
    camera.position.set(0, 1.25, 4.85);
    controls.target.set(0, 1.1, 0.025);
    controls.minDistance = 2.4;
  }
  controls.update();
}
onMounted(async () => {
  try {
    T = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    if (!active) return;
    scene = new T.Scene();
    scene.background = null;
    camera = new T.PerspectiveCamera(29, 1, 0.1, 50);
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', '3D garment preview');
    renderer.domElement.setAttribute('role', 'img');
    host.value.appendChild(renderer.domElement);
    renderer.domElement.addEventListener(
      'webglcontextlost',
      () => {
        fallback.value = true;
        loading.value = false;
        cancelAnimationFrame(frame);
      },
      { once: true }
    );
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.6;
    controls.minPolarAngle = Math.PI * 0.26;
    controls.enableDamping = true;
    cameraView();
    scene.add(new T.HemisphereLight('#ffffff', '#bcb7af', 2.0));
    const key = new T.DirectionalLight('#fff7ef', 2.5);
    key.position.set(2.5, 4.2, 3.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -1.5;
    key.shadow.camera.right = 1.5;
    key.shadow.camera.top = 2.5;
    key.shadow.camera.bottom = -0.5;
    key.shadow.normalBias = 0.015;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new T.DirectionalLight('#eef2ff', 1.3);
    fill.position.set(-3, 2, 2);
    scene.add(fill);
    const rim = new T.DirectionalLight('#ffffff', 1.5);
    rim.position.set(1, 3, -3);
    scene.add(rim);
    const floor = new T.Mesh(
      new T.CircleGeometry(3, 80),
      new T.MeshStandardMaterial({ color: '#eeedea', roughness: 0.95 })
    );
    floor.name = 'stage-floor';
    floor.visible = props.mode === 'tryon';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.035;
    floor.receiveShadow = true;
    scene.add(floor);
    const plinth = new T.Mesh(
      new T.CylinderGeometry(0.51, 0.54, 0.035, 80),
      new T.MeshStandardMaterial({ color: '#e4e1da', roughness: 0.7 })
    );
    plinth.name = 'stage-plinth';
    plinth.visible = props.mode === 'tryon';
    plinth.position.y = -0.018;
    plinth.receiveShadow = true;
    scene.add(plinth);
    observer = new ResizeObserver(() => {
      if (!host.value || !active) return;
      const w = host.value.clientWidth,
        h = host.value.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(host.value);
    rebuild();
    loading.value = false;
    const animate = () => {
      if (!active || fallback.value) return;
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
watch(angle, (v) => {
  if (model) model.rotation.y = (v * Math.PI) / 180;
});
watch(viewMode, cameraView);
watch(
  () => [props.mode, props.config?.garmentType],
  () => {
    rebuild();
    cameraView();
    if (scene) {
      for (const name of ['stage-floor', 'stage-plinth']) {
        const o = scene.getObjectByName(name);
        if (o) o.visible = props.mode === 'tryon';
      }
    }
  }
);
watch(
  () => props.metrics,
  () => {
    if (viewMode.value !== 'full' || props.mode === 'garment') cameraView();
  },
  { deep: true }
);
onBeforeUnmount(() => {
  active = false;
  cancelAnimationFrame(frame);
  observer?.disconnect();
  controls?.dispose();
  release(model);
  if (scene) release(scene);
  for (const entry of textiles.values()) {
    entry.color.dispose();
    entry.bump.dispose();
  }
  textiles.clear();
  renderer?.dispose();
});
</script>
<template>
  <div
    class="fitting-room atelier-room spatial-room"
    :class="{ 'product-stage': mode === 'garment' }"
  >
    <div class="spatial-backdrop" aria-hidden="true"></div>
    <div class="room-label">
      <span class="live-dot"></span>SMARTFIT / VIRTUAL ATELIER<span class="pill">{{
        $t(mode === 'garment' ? '服裝獨立預覽' : '你的空間，你的風格')
      }}</span>
    </div>
    <div v-if="loading" class="model-loading">
      <div></div>
      <p>{{ $t('正在準備服裝工作台…') }}</p>
    </div>
    <div v-show="!fallback" ref="host" class="webgl-host"></div>
    <GarmentArt v-if="fallback" :config="config" />
    <div v-if="!fallback && !loading" class="atelier-view-switch">
      <button :class="{ selected: viewMode === 'full' }" @click="viewMode = 'full'">
        {{ $t('整體造型') }}</button
      ><button :class="{ selected: viewMode === 'upper' }" @click="viewMode = 'upper'">
        {{ $t('上身視圖') }}</button
      ><button :class="{ selected: viewMode === 'fabric' }" @click="viewMode = 'fabric'">
        <Icon name="search" :size="13" />{{ $t('織物細節') }}
      </button>
    </div>
    <div v-if="!fallback && !loading" class="stage-material-label">
      <small>{{ $t('面料') }}</small
      ><b>{{
        $t(
          { linen: '天然亚麻', cotton: '有机棉', silk: '桑蚕丝', wool: '精纺羊毛' }[config.fabricId]
        )
      }}</b
      ><span :style="{ background: config.colorHex }"></span
      ><code>{{ config.colorHex.toUpperCase() }}</code>
    </div>
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
      {{ $t(fallback ? '2D 預覽僅展示服裝參數' : '拖動旋轉 · 滾輪縮放') }} ·
      {{ $t('造型與織物視覺參考，非物理布料模擬') }}
    </p>
  </div>
</template>
