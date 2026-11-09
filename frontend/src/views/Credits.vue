<script setup>
import credits from '../../public/editorial/credits.json';
import idolCredits from '../../public/editorial/idols/credits.json';
import { officialPosts, verifiedReport } from '../../../shared/idolEditorial';
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
    <section class="panel credits-idol-section">
      <h2>{{ $t('明星活動資料照') }}</h2>
      <p>{{ $t('以下照片保留作者、拍攝日期及授權；照片與 Instagram 原帖可能是不同活動。') }}</p>
      <div class="credits-grid">
        <div v-for="photo in idolCredits" :key="photo.id">
          <a :href="photo.source" target="_blank" rel="noopener noreferrer"
            ><img :src="'/editorial/idols/' + photo.file" :alt="photo.person" loading="lazy"
          /></a>
          <div class="credit-caption">
            <strong>{{ photo.person }} · {{ photo.date }}</strong>
            <p>{{ photo.title }}</p>
            <p>{{ photo.author }}</p>
            <a :href="photo.licenseUrl" target="_blank" rel="noopener noreferrer">{{
              photo.license
            }}</a>
            <p>{{ $t('已縮放及轉為 WebP；展示時可能裁切。') }}</p>
            <a :href="'/editorial/idols/' + photo.file" target="_blank" rel="noopener noreferrer"
              >{{ $t('查看衍生圖片') }} ↗</a
            >
          </div>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>{{ $t('Instagram 與報道來源') }}</h2>
      <p>{{ $t('原帖由平台提供展示；不下載或重新託管 Instagram 原圖。') }}</p>
      <ul class="social-source-list">
        <li v-for="post in officialPosts" :key="post.id">
          <b>{{ post.person }}</b> · {{ post.dateEn || post.date }} ·
          <a :href="post.url" target="_blank" rel="noopener noreferrer">Instagram ↗</a> ·
          <a :href="post.verifiedSource" target="_blank" rel="noopener noreferrer"
            >{{ $t('核驗報道') }} ↗</a
          >
        </li>
        <li>
          <a :href="verifiedReport.url" target="_blank" rel="noopener noreferrer"
            >Vogue Hong Kong · {{ verifiedReport.date }} ↗</a
          >
        </li>
      </ul>
    </section>
    <section class="panel">
      <h2>{{ $t('3D 數字模特') }}</h2>
      <p>
        {{
          $t(
            '現行工作室採用本專案建立的簡約展示模特與程序化服裝、織物材質。舊版 MakeHuman CC0 資產僅保留作歷史參考，不再用於現行模特。預覽不代表物理布料模擬。'
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
