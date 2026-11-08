<script setup>
import { computed } from 'vue';
const props = defineProps({
  config: { type: Object, default: () => ({}) },
  scene: { type: Boolean, default: true },
});
const c = computed(() => ({
  garmentType: 'dress',
  colorHex: '#8c9b82',
  silhouette: 'A-line',
  length: 'midi',
  sleeve: 'short',
  collar: 'round',
  embroidery: 'none',
  ...props.config,
}));
const hem = computed(() =>
  c.value.garmentType === 'top'
    ? 260
    : c.value.length === 'short'
      ? 302
      : c.value.length === 'maxi'
        ? 465
        : 408
);
const width = computed(() =>
  c.value.silhouette === 'A-line' ? 98 : c.value.silhouette === 'fitted' ? 53 : 65
);
</script>
<template>
  <svg
    class="garment-art"
    viewBox="0 0 320 500"
    role="img"
    :aria-label="'定制服装预览：' + c.garmentType"
  >
    <g v-if="scene" fill="none" stroke="currentColor" opacity=".08">
      <path d="M18 500V135a142 142 0 0 1 284 0v365M40 500V139a120 120 0 0 1 240 0v361" />
      <path d="M0 448h320" />
    </g>
    <ellipse cx="160" cy="474" rx="96" ry="12" fill="#263b31" opacity=".08" />
    <path
      d="M148 98V81a12 12 0 1 1 24 0c0 10-12 11-12 21l-68 34h136l-68-34"
      fill="none"
      stroke="#887b67"
      stroke-width="3"
    />
    <g :fill="c.colorHex" stroke="#29352c" stroke-opacity=".18" stroke-width="1.2">
      <path
        v-if="c.sleeve !== 'sleeveless'"
        :d="
          c.sleeve === 'long'
            ? 'M115 127 98 135 61 302 88 310 123 173ZM205 127 222 135 259 302 232 310 197 173Z'
            : 'M115 127 98 135 75 196 107 207 126 165ZM205 127 222 135 245 196 213 207 194 165Z'
        "
      />
      <path
        :d="`M115 127 140 121 Q160 146 180 121L205 127 199 184 187 224 Q${190 + width / 3} ${hem - 60} ${160 + width} ${hem} Q160 ${hem + 22} ${160 - width} ${hem} Q${130 - width / 3} ${hem - 60} 133 224L121 184Z`"
      />
    </g>
    <path
      :d="
        c.collar === 'v-neck'
          ? 'M140 122 160 159 180 122'
          : c.collar === 'square'
            ? 'M140 123v24h40v-24'
            : 'M140 122Q160 152 180 122'
      "
      fill="#eadfd0"
      stroke="#29352c"
      stroke-opacity=".2"
    />
    <path d="M133 224q27 10 54 0" fill="none" stroke="#29352c" stroke-opacity=".22" />
    <g v-if="c.garmentType === 'dress'" stroke="#fff" stroke-opacity=".22" fill="none">
      <path :d="`M141 238Q139 ${hem - 60} ${136 - width / 3} ${hem}`" />
      <path :d="`M178 238Q181 ${hem - 60} ${184 + width / 3} ${hem}`" />
    </g>
    <g v-if="c.embroidery === 'floral'" transform="translate(181 179)" fill="#e9ddc6">
      <circle r="6" />
      <circle cx="7" r="4" />
      <circle cx="-7" r="4" />
      <circle cy="7" r="4" />
      <circle cy="-7" r="4" />
      <circle r="3" fill="#b5955c" />
    </g>
    <text
      v-if="c.embroidery === 'initials'"
      x="177"
      y="190"
      font-size="15"
      font-family="serif"
      fill="#ead6ad"
    >
      SF
    </text>
    <path
      v-if="c.fabricId === 'linen'"
      d="M144 165v40m8-46v55m10-53v52m10-49v46"
      stroke="#fff"
      stroke-opacity=".12"
    />
  </svg>
</template>
