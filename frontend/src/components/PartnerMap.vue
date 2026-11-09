<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import 'leaflet/dist/leaflet.css';
import { mapPoints, mapCenter, mapLink, tileUrl } from '../mapModel';
import { locale, translate } from '../i18n';
import Icon from './Icon.vue';
const props = defineProps({
  partners: { type: Array, default: () => [] },
  city: String,
  selected: String,
  userPosition: Array,
});
const emit = defineEmits(['select']);
const host = ref(null),
  ready = ref(false),
  failed = ref(false),
  tileProblem = ref(false);
let L,
  map,
  tiles,
  group,
  userGroup,
  observer,
  active = true;
const markers = new Map();
const externalUrl = computed(() => mapLink(props.userPosition || mapCenter(props.city)));
function updateSelected(pan = false) {
  if (!map) return;
  for (const [id, marker] of markers) {
    const chosen = id === props.selected;
    marker.getElement()?.classList.toggle('chosen', chosen);
    marker.setZIndexOffset(chosen ? 1000 : 0);
    if (chosen && pan)
      map.panTo(marker.getLatLng(), {
        animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      });
  }
}
function fit() {
  if (!map) return;
  const points = mapPoints(props.partners);
  if (points.length)
    map.fitBounds(L.latLngBounds(points.map((p) => p.coordinates)), {
      padding: [60, 60],
      maxZoom: 14,
      animate: false,
    });
  else
    map.setView(props.userPosition || mapCenter(props.city), props.userPosition ? 13 : 12, {
      animate: false,
    });
}
function redraw() {
  if (!map) return;
  group.clearLayers();
  userGroup.clearLayers();
  markers.clear();
  mapPoints(props.partners).forEach((p, i) => {
    const badge = document.createElement('span');
    badge.className = 'live-map-pin';
    const number = document.createElement('b');
    number.textContent = String(i + 1);
    badge.appendChild(number);
    const marker = L.marker(p.coordinates, {
      icon: L.divIcon({
        html: badge,
        className: 'live-map-marker',
        iconSize: [36, 42],
        iconAnchor: [18, 40],
      }),
      title: translate(p.name),
      keyboard: true,
    }).addTo(group);
    const tip = document.createElement('div');
    tip.className = 'map-tooltip';
    tip.textContent = translate(p.name);
    marker.bindTooltip(tip, { direction: 'top', offset: [0, -28] });
    marker.on('click', () => emit('select', p.id));
    markers.set(p.id, marker);
  });
  if (props.userPosition) {
    L.circle(props.userPosition, {
      radius: 5000,
      color: '#ff354f',
      weight: 1,
      fillOpacity: 0.035,
    }).addTo(userGroup);
    L.circleMarker(props.userPosition, {
      radius: 6,
      color: '#fff',
      weight: 3,
      fillColor: '#3878e8',
      fillOpacity: 1,
    }).addTo(userGroup);
  }
  fit();
  requestAnimationFrame(() => updateSelected());
}
onMounted(async () => {
  try {
    const module = await import('leaflet');
    L = module.default || module;
    if (!active) return;
    map = L.map(host.value, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      keyboard: true,
      minZoom: 3,
      maxZoom: 19,
    }).setView(mapCenter(props.city), 12);
    L.control
      .zoom({
        position: 'topright',
        zoomInTitle: translate('放大地圖'),
        zoomOutTitle: translate('縮小地圖'),
      })
      .addTo(map);
    tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      crossOrigin: false,
    }).addTo(map);
    tiles.on('tileerror', () => {
      tileProblem.value = true;
    });
    tiles.on('tileload', () => {
      tileProblem.value = false;
    });
    group = L.layerGroup().addTo(map);
    userGroup = L.layerGroup().addTo(map);
    observer = new ResizeObserver(() => map?.invalidateSize({ pan: false }));
    observer.observe(host.value);
    ready.value = true;
    redraw();
  } catch {
    failed.value = true;
  }
});
watch(() => [props.partners, props.city, props.userPosition], redraw, { deep: true });
watch(
  () => props.selected,
  () => updateSelected(true)
);
watch(locale, () => {
  redraw();
  const root = map?.getContainer();
  if (root) {
    root.querySelector('.leaflet-control-zoom-in').title = translate('放大地圖');
    root.querySelector('.leaflet-control-zoom-out').title = translate('縮小地圖');
  }
});
onBeforeUnmount(() => {
  active = false;
  observer?.disconnect();
  map?.remove();
  map = null;
  markers.clear();
});
function retry() {
  tileProblem.value = false;
  tiles?.redraw();
}
</script>
<template>
  <div class="partner-map live-partner-map">
    <div
      ref="host"
      class="live-map-canvas"
      role="region"
      :aria-label="$t('可拖動及縮放的地圖')"
      tabindex="0"
    ></div>
    <div v-if="!ready && !failed" class="map-loading">{{ $t('正在載入互動地圖…') }}</div>
    <div v-if="failed || tileProblem" class="map-network-notice" role="status">
      <p>{{ $t('底圖暫時無法載入，店鋪列表仍可使用。') }}</p>
      <button v-if="!failed" class="text-button" @click="retry">{{ $t('重試底圖') }}</button
      ><a :href="externalUrl" target="_blank" rel="noopener noreferrer"
        >{{ $t('在 OpenStreetMap 開啟') }} ↗</a
      >
    </div>
    <button v-if="ready" class="map-fit-button secondary small" @click="fit">
      <Icon name="pin" :size="14" />{{ $t('顯示全部位置') }}
    </button>
    <div class="live-map-caption">
      <span class="live-dot"></span>
      <div>
        <b>{{ $t('真實地圖 · 拖動與縮放') }}</b>
        <p>{{ $t('標記為演示店鋪，並非已核實商戶。') }}</p>
      </div>
    </div>
  </div>
</template>
