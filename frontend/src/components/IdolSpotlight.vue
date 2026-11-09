<script setup>
import { ref, nextTick } from 'vue';
import { officialPosts, idolEditorial, verifiedReport } from '../../../shared/idolEditorial';
import { locale } from '../i18n';
import { instagramEmbedUrl } from '../socialSources';
import Icon from './Icon.vue';
const selected = ref(null),
  dialog = ref(null);
const photoFor = (post) => idolEditorial.find((p) => p.id === post.photoId);
async function open(post) {
  if (!instagramEmbedUrl(post.url)) return;
  selected.value = post;
  await nextTick();
  if (typeof dialog.value.showModal === 'function') dialog.value.showModal();
  else dialog.value.setAttribute('open', '');
}
function close() {
  dialog.value?.close?.();
  selected.value = null;
}
</script>
<template>
  <section class="idol-spotlight">
    <div class="section-title">
      <div>
        <div class="eyebrow">IDOL STYLE FILES</div>
        <h2>{{ $t('從舞台到日常，靈感正在發生。') }}</h2>
        <p>{{ $t('有日期、有來源的明星穿搭選集。') }}</p>
      </div>
      <span class="source-verified"><Icon name="check" :size="13" />{{ $t('編輯核對來源') }}</span>
    </div>
    <div class="official-post-grid">
      <article v-for="post in officialPosts" :key="post.id" class="official-post-card">
        <div class="official-post-photo" v-if="photoFor(post)">
          <img :src="photoFor(post).imageUrl" :alt="post.person" loading="lazy" /><span
            >{{ $t('資料照') }} · {{ photoFor(post).eventDate }}</span
          >
        </div>
        <div v-else class="official-post-letter">
          <span>JISOO</span><small>OFFICIAL INSTAGRAM</small>
        </div>
        <div class="official-post-copy">
          <div class="official-handle"><Icon name="camera" :size="13" />@{{ post.handle }}</div>
          <small class="official-date">{{
            locale === 'en' && post.dateEn ? post.dateEn : post.date
          }}</small>
          <h3>{{ locale === 'en' ? post.titleEn : post.title }}</h3>
          <p>{{ locale === 'en' ? post.summaryEn : post.summary }}</p>
          <button class="text-button" @click="open(post)">{{ $t('載入 Instagram 原帖') }} ↗</button
          ><a
            :href="post.verifiedSource"
            target="_blank"
            rel="noopener noreferrer"
            class="source-story-link"
            >{{ $t('核驗報道') }}</a
          >
        </div>
      </article>
    </div>
    <p class="source-footnote">{{ $t('資料照與原帖為不同活動；按下載入將連線至 Instagram。') }}</p>
    <a
      class="verified-report-card"
      :href="verifiedReport.url"
      target="_blank"
      rel="noopener noreferrer"
      ><span class="report-year">2026</span>
      <div>
        <div class="eyebrow">VOGUE HONG KONG / {{ verifiedReport.date }}</div>
        <h3>{{ locale === 'en' ? verifiedReport.titleEn : verifiedReport.title }}</h3>
        <p>{{ locale === 'en' ? verifiedReport.summaryEn : verifiedReport.summary }}</p>
      </div>
      <span class="report-cta">{{ $t('閱讀來源') }}<Icon name="arrow" :size="18" /></span></a
    ><Teleport to="body"
      ><dialog
        ref="dialog"
        class="instagram-dialog"
        @cancel.prevent="close"
        @click="
          (e) => {
            if (e.target === dialog) close();
          }
        "
      >
        <template v-if="selected"
          ><div class="social-dialog-heading">
            <div>
              <small>OFFICIAL INSTAGRAM</small>
              <h2>@{{ selected.handle }}</h2>
            </div>
            <button class="icon-button" :aria-label="$t('關閉原帖')" @click="close">
              <Icon name="close" />
            </button>
          </div>
          <iframe
            :src="instagramEmbedUrl(selected.url)"
            :title="selected.person + ' Instagram'"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
          <div class="social-dialog-footer">
            <p>{{ $t('若平台限制顯示，請直接開啟官方原帖。') }}</p>
            <a :href="selected.url" target="_blank" rel="noopener noreferrer" class="primary small"
              >{{ $t('前往 Instagram') }} ↗</a
            >
          </div></template
        >
      </dialog></Teleport
    >
  </section>
</template>
