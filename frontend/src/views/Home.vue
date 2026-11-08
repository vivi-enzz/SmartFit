<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { api } from '../api';
import { locale } from '../i18n';
import Icon from '../components/Icon.vue';
import PostCard from '../components/PostCard.vue';
import { editorial } from '../../../shared/editorial';
const city = ref('Hong Kong'),
  data = ref(null),
  error = ref(''),
  posts = ref([]),
  busy = ref(false),
  router = useRouter(),
  store = useStore();
async function load() {
  busy.value = true;
  error.value = '';
  try {
    data.value = await api('/homepage-recommendations?city=' + city.value);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
onMounted(async () => {
  await load();
  try {
    posts.value = (await api('/posts')).posts.slice(0, 8);
  } catch (e) {
    error.value = e.message;
  }
});
async function like(p) {
  if (!store.state.user) return router.push({ path: '/account', query: { next: '/' } });
  try {
    Object.assign(p, await api('/posts/' + p.id + '/like', { method: 'POST' }));
  } catch (e) {
    error.value = e.message;
  }
}
</script>
<template>
  <div class="home">
    <section class="fashion-hero">
      <div class="fashion-hero-copy">
        <div class="eyebrow"><span class="red-dot"></span> THE NEW PERSONAL STYLE</div>
        <h1>
          {{ $t('穿出你的') }}<br /><span>{{ $t('下一個版本。') }}</span>
        </h1>
        <p>
          {{ $t('從街頭靈感到專屬訂製。') }}<br />{{ $t('發現喜歡的風格，把它變成你的日常。') }}
        </p>
        <div class="hero-buttons">
          <RouterLink to="/studio" class="primary"
            >{{ $t('開啟我的訂製') }}<Icon name="arrow" :size="18" /></RouterLink
          ><RouterLink to="/community" class="hero-secondary">{{
            $t('探索穿搭社群 ↗')
          }}</RouterLink>
        </div>
        <div class="hero-editor-note">
          <span>01 / THE CITY EDIT</span
          ><span>{{ $t('靈感來自真實街頭') }}<br />{{ $t('風格由你重新定義') }}</span>
        </div>
      </div>
      <RouterLink to="/community/seed-1" class="fashion-hero-photo"
        ><img
          src="/editorial/look-1.webp"
          :alt="$t('城市街頭的藍色風衣穿搭攝影')"
          fetchpriority="high"
        />
        <div class="hero-photo-top"><span>THE SMARTFIT EDIT</span><span>2026 / VOL. 01</span></div>
        <div class="hero-photo-title">
          <div>
            <small>MILAN, WITH ATTITUDE.</small>
            <h2>City is your<br /><em>runway.</em></h2>
          </div>
          <span class="hero-photo-arrow"><Icon name="arrow" :size="25" /></span>
        </div>
        <span class="photo-credit">{{ $t('攝影靈感 · Unsplash') }}</span></RouterLink
      >
    </section>
    <div class="style-marquee">
      <span>DISCOVER.</span><Icon name="spark" :size="18" /><span>MAKE IT YOURS.</span
      ><Icon name="spark" :size="18" /><span>WEAR IT YOUR WAY.</span
      ><Icon name="spark" :size="18" /><span>SMARTFIT.</span>
    </div>
    <section class="section trend-section">
      <div class="section-title">
        <div>
          <div class="eyebrow">YOUR NEXT STYLE OBSESSION</div>
          <h2>{{ $t('現在，流行做自己。') }}</h2>
        </div>
        <RouterLink to="/community" class="underlink"
          >{{ $t('探索全部風格') }}<Icon name="arrow" :size="17"
        /></RouterLink>
      </div>
      <div class="trend-grid">
        <RouterLink
          v-for="(item, i) in [
            { id: 0, label: '都會通勤', en: 'CITY UNIFORM', category: 'work' },
            { id: 8, label: '日常街頭', en: 'OFF-DUTY', category: 'daily' },
            { id: 3, label: '週末出逃', en: 'WEEKEND ESCAPE', category: 'occasion' },
          ]"
          :key="item.category"
          :to="{ path: '/community', query: { category: item.category } }"
          class="trend-card"
          ><img :src="editorial[item.id].imageUrl" :alt="$t(item.label)" loading="lazy" />
          <div>
            <span>0{{ $t(i + 1) }} / {{ $t(item.en) }}</span>
            <h3>{{ $t(item.label) }}</h3>
            <Icon name="arrow" :size="20" /></div
        ></RouterLink>
      </div>
    </section>
    <section class="weather-edit section">
      <div class="weather-edit-heading">
        <div class="eyebrow">STYLE MEETS YOUR DAY</div>
        <h2>{{ $t('好搭，也要好穿。') }}</h2>
        <p v-if="data?.weather">
          <Icon name="sun" :size="17" />{{ $t(data.weather.temperature) }}°C ·
          {{ $t(data.weather.condition) }}<small>{{ $t('情境展示') }}</small>
        </p>
        <p v-else>{{ $t(data?.message || '正在準備面料推薦…') }}</p>
      </div>
      <label class="city-select"
        ><Icon name="pin" :size="16" /><select
          v-model="city"
          @change="load"
          :aria-label="$t('選擇城市')"
        >
          <option value="Hong Kong">{{ $t('香港') }}</option>
          <option value="Shanghai">{{ $t('上海') }}</option>
          <option value="Beijing">{{ $t('北京') }}</option>
          <option value="Shenzhen">{{ $t('深圳') }}</option>
        </select></label
      >
      <div class="weather-edit-fabrics">
        <RouterLink
          v-for="f in data?.fabrics"
          :key="f.id"
          :to="{ path: '/studio', query: { fabric: f.id } }"
          ><span class="fabric-swatch" :style="{ backgroundColor: f.tone }"></span>
          <div>
            <b>{{ $t(f.name) }}</b
            ><small>{{ $t(f.description) }}</small>
          </div>
          <Icon name="arrow" :size="16"
        /></RouterLink>
      </div>
    </section>
    <section class="section style-feed-section">
      <div class="section-title">
        <div>
          <div class="eyebrow">THE STYLE FEED</div>
          <h2>{{ $t('真實穿搭，無限靈感。') }}</h2>
          <p>{{ $t('從街頭瞬間到衣櫥提案，找到下一套想穿的風格。') }}</p>
        </div>
        <RouterLink to="/community" class="underlink"
          >{{ $t('進入穿搭社群') }}<Icon name="arrow" :size="17"
        /></RouterLink>
      </div>
      <p v-if="error" class="error-box" role="alert">{{ $t(error) }}</p>
      <div class="post-grid home-style-feed">
        <PostCard v-for="p in posts" :key="p.id" :post="p" @like="like" />
      </div>
      <p class="editorial-disclaimer">
        {{ $t('真人攝影為編輯靈感選集，非用戶購買見證；照片款式與訂製預覽可能不同。') }}
      </p>
    </section>
    <section class="custom-promo section">
      <div class="custom-promo-copy">
        <div class="eyebrow">DON'T JUST SAVE IT. CREATE IT.</div>
        <h2>
          {{ $t('收藏靈感之後，') }}<br />{{ $t('讓它真正') }}<span>{{ $t('屬於你。') }}</span>
        </h2>
        <p>
          {{ $t('選面料、改顏色、調整版型。') }}<br />{{
            $t('在 3D 工作室，把喜歡穿成自己的樣子。')
          }}
        </p>
        <RouterLink to="/studio" class="primary"
          >{{ $t('進入 3D 訂製工作室') }}<Icon name="arrow" :size="18"
        /></RouterLink>
      </div>
      <div class="custom-promo-image">
        <img src="/editorial/look-6.webp" :alt="$t('日常衣櫥與服裝攝影')" loading="lazy" /><span
          >YOUR WARDROBE.<br />YOUR RULES.</span
        >
      </div>
    </section>
  </div>
</template>
