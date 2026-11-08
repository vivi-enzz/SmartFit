<script setup>
import credits from '../../public/editorial/credits.json';
</script>
<template>
  <div class="page credits-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">CREATIVE CREDITS</div>
        <h1>{{ $t('真實靈感，清晰來源。') }}</h1>
        <p>{{ $t('謝謝讓好作品被看見的創作者。') }}</p>
      </div>
    </div>
    <section class="panel">
      <h2>{{ $t('真人穿搭攝影') }}</h2>
      <p>
        {{
          $t(
            '攝影來自 Unsplash，依其圖片授權使用。圖片用於編輯風格參考，不代表照片人物為本站用戶、合作夥伴或產品代言人。'
          )
        }}
      </p>
      <a
        class="underlink"
        href="https://unsplash.com/license"
        target="_blank"
        rel="noopener noreferrer"
        >Unsplash License ↗</a
      >
      <div class="credits-grid">
        <a
          v-for="photo in credits"
          :key="photo.file"
          :href="photo.url"
          target="_blank"
          rel="noopener noreferrer"
          ><img :src="'/editorial/' + photo.file" :alt="$t(photo.file)" loading="lazy" /><span
            >{{ $t(photo.source) }} · {{ $t(photo.file) }} ↗</span
          ></a
        >
      </div>
    </section>
    <section class="panel">
      <h2>{{ $t('3D 數字模特') }}</h2>
      <p>
        {{
          $t(
            '人體幾何基於 MakeHuman 的 CC0 基礎網格與女性形態資料，經本專案處理及加入髮型、材質、服裝與燈光。模型用於造型預覽，不代表真實人體掃描或物理試衣結果。'
          )
        }}
      </p>
      <a
        class="underlink"
        href="https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md"
        target="_blank"
        rel="noopener noreferrer"
        >MakeHuman License ↗</a
      >
    </section>
  </div>
</template>
