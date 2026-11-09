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
  construction: 'classic',
  layer: 'none',
  accentColor: '#34363a',
  ...props.config,
}));
const hem = computed(() =>
  c.value.garmentType !== 'dress'
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
    :aria-label="$t('定制服装预览：' + c.garmentType)"
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
    <g
      v-if="c.construction === 'pleated'"
      data-construction="pleated"
      fill="none"
      stroke="#29352c"
      stroke-opacity=".24"
    >
      <path
        v-for="n in 11"
        :key="n"
        :d="`M${133 + n * 4.5} 230 Q${133 + n * 4.5} ${hem - 55} ${160 - width + (n / 12) * width * 2} ${hem + 5}`"
      />
    </g>
    <g
      v-if="c.garmentType === 'hoodie'"
      data-garment="hoodie"
      :fill="c.colorHex"
      stroke="#29352c"
      stroke-opacity=".3"
    >
      <path
        d="M131 126Q103 100 126 72Q160 47 194 72Q217 100 189 126L176 120Q193 99 176 84Q160 76 144 84Q127 99 144 120Z"
      />
      <path d="M132 220 143 199h34l11 21v22h-56Z" />
      <path
        d="M136 127 140 180M184 127 181 177"
        fill="none"
        stroke="#eee"
        stroke-opacity=".8"
        stroke-width="2"
      />
      <path
        d="M63 293 88 301 86 316 59 309ZM232 301 257 293 261 309 234 316ZM96 258Q160 276 224 258v11Q160 287 96 269Z"
      />
    </g>
    <g v-if="c.construction === 'wrap'" data-construction="wrap">
      <path
        :d="`M184 133 Q154 196 133 224 L${160 + width * 0.35} ${hem + 9} Q${160 + width * 0.65} ${hem - 65} 184 133`"
        :fill="c.colorHex"
        stroke="#29352c"
        stroke-opacity=".3"
      />
      <path
        d="M132 224 Q160 235 190 223 M188 226l17 33"
        fill="none"
        stroke="#fff"
        stroke-opacity=".5"
        stroke-width="3"
      />
    </g>
    <g
      v-if="c.construction === 'tiered'"
      data-construction="tiered"
      :fill="c.colorHex"
      stroke="#29352c"
      stroke-opacity=".2"
    >
      <path
        v-for="n in 3"
        :key="n"
        :d="`M${133 - n * width * 0.23} ${224 + ((hem - 224) * (n - 1)) / 3} Q160 ${238 + ((hem - 224) * (n - 1)) / 3} ${187 + n * width * 0.23} ${224 + ((hem - 224) * (n - 1)) / 3} L${187 + (n + 1) * width * 0.23} ${224 + ((hem - 224) * n) / 3} Q160 ${246 + ((hem - 224) * n) / 3} ${133 - (n + 1) * width * 0.23} ${224 + ((hem - 224) * n) / 3}Z`"
      />
    </g>
    <g
      v-if="c.layer !== 'none'"
      :data-layer="c.layer"
      :fill="c.accentColor"
      stroke="#111"
      stroke-opacity=".25"
    >
      <path
        v-if="c.layer === 'cropped-jacket'"
        d="M139 119 111 126 98 136 73 222 97 230 119 165 122 229 148 236 151 154ZM181 119 209 126 222 136 247 222 223 230 201 165 198 229 172 236 169 154Z"
      />
      <path
        v-else
        d="M139 119 114 129 123 185 113 333 146 342 151 154ZM181 119 206 129 197 185 207 333 174 342 169 154Z"
      />
      <path
        d="M139 119 130 151 145 170 151 154ZM181 119 190 151 175 170 169 154Z"
        stroke="#fff"
        stroke-opacity=".4"
      />
      <circle cx="143" cy="205" r="2" fill="#c5b38a" />
      <circle cx="177" cy="205" r="2" fill="#c5b38a" />
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
