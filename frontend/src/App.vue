<script setup>
import release from '../../package.json';
import { ref, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import Icon from './components/Icon.vue';
import { api } from './api';
import { locale, setLocale } from './i18n';
const store = useStore(),
  route = useRoute(),
  router = useRouter(),
  menu = ref(false),
  q = ref(''),
  results = ref([]),
  searchOpen = ref(false);
let timer,
  toastTimer,
  generation = 0;
watch(
  () => route.fullPath,
  () => {
    menu.value = false;
    searchOpen.value = false;
  }
);
watch(q, (v) => {
  clearTimeout(timer);
  const current = ++generation;
  if (!v.trim()) {
    results.value = [];
    searchOpen.value = false;
    return;
  }
  timer = setTimeout(async () => {
    try {
      const r = await api('/search?q=' + encodeURIComponent(v));
      if (current === generation) {
        results.value = r.results;
        searchOpen.value = true;
      }
    } catch {
      results.value = [];
    }
  }, 180);
});
watch(
  () => store.state.toast,
  () => {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => store.commit('toast', { message: '' }), 5000);
  }
);
onUnmounted(() => {
  clearTimeout(timer);
  clearTimeout(toastTimer);
});
const nav = [
  ['/', '探索靈感'],
  ['/studio', '訂製工作室'],
  ['/community', '穿搭社群'],
  ['/partners', '線下服務'],
];
function search() {
  router.push({ path: '/community', query: { q: q.value } });
  searchOpen.value = false;
}
</script>
<template>
  <a class="skip-link" href="#main">{{ $t('跳到主要內容') }}</a>
  <div class="commerce-ribbon">
    <span>YOUR STYLE. YOUR FIT.</span><span>{{ $t('靈感無界 · 風格由你') }}</span
    ><RouterLink to="/studio">{{ $t('探索專屬訂製 ↗') }}</RouterLink>
  </div>
  <header class="header">
    <div class="nav-wrap">
      <RouterLink to="/" class="brand" :aria-label="$t('SmartFit 首頁')"
        >smartfit<span class="brand-dot">®</span></RouterLink
      >
      <nav class="desktop-nav" :aria-label="$t('主導航')">
        <RouterLink
          v-for="[url, label] in nav"
          :key="url"
          :to="url"
          :class="{ active: url === '/' ? route.path === '/' : route.path.startsWith(url) }"
          >{{ $t(label) }}<span v-if="url === '/studio'" class="nav-new">NEW</span></RouterLink
        >
      </nav>
      <div class="nav-actions">
        <div class="search-wrap">
          <form class="search" @submit.prevent="search">
            <Icon name="search" :size="17" /><input
              v-model="q"
              :aria-label="$t('搜尋穿搭與面料')"
              :placeholder="$t('搜尋你的下一個風格')"
              @focus="searchOpen = !!q"
              @keydown.esc="searchOpen = false"
            /><button class="sr-only">{{ $t('搜尋') }}</button>
          </form>
          <div v-if="searchOpen" class="search-results">
            <RouterLink v-for="r in results" :key="r.id" :to="'/community/' + r.id">{{
              $t(r.title)
            }}</RouterLink>
            <p v-if="!results.length">{{ $t('未找到靈感，試試「亞麻」。') }}</p>
            <button class="text-button" @click="searchOpen = false">{{ $t('關閉') }}</button>
          </div>
        </div>
        <button
          class="language-switch"
          @click="setLocale(locale === 'en' ? 'zh-Hant' : 'en')"
          :aria-label="$t(locale === 'en' ? '切換至繁體中文' : 'Switch to English')"
        >
          <span :class="{ on: locale === 'zh-Hant' }">{{ $t('繁') }}</span
          ><i>/</i><span :class="{ on: locale === 'en' }">EN</span></button
        ><RouterLink to="/designs" class="icon-button" :aria-label="$t('我的設計')"
          ><Icon name="bag" /></RouterLink
        ><RouterLink to="/account" class="avatar" :aria-label="$t('我的帳戶')">{{
          $t(store.state.user ? store.state.user.name.slice(0, 1) : 'SF')
        }}</RouterLink
        ><button
          class="icon-button mobile-menu"
          :aria-label="$t('展開導覽')"
          :aria-expanded="menu"
          @click="menu = !menu"
        >
          <Icon :name="menu ? 'close' : 'menu'" />
        </button>
      </div>
    </div>
    <nav v-if="menu" class="mobile-nav">
      <RouterLink
        v-for="[url, label] in [...nav, ['/designs', '我的設計'], ['/orders', '我的訂單']]"
        :key="url"
        :to="url"
        >{{ $t(label) }}</RouterLink
      >
    </nav>
  </header>
  <main id="main" tabindex="-1"><RouterView /></main>
  <nav class="mobile-bottom-nav" :aria-label="$t('快捷導航')">
    <RouterLink to="/" :class="{ active: route.path === '/' }"
      ><Icon name="search" :size="20" /><span>{{ $t('探索') }}</span></RouterLink
    ><RouterLink
      to="/community"
      :class="{ active: route.path.startsWith('/community') && !route.query.saved }"
      ><Icon name="heart" :size="20" /><span>{{ $t('社群') }}</span></RouterLink
    ><RouterLink
      to="/studio"
      :class="{ active: route.path.startsWith('/studio') }"
      class="mobile-create"
      ><Icon name="plus" :size="22" /><span>{{ $t('訂製') }}</span></RouterLink
    ><RouterLink to="/community?saved=1" :class="{ active: !!route.query.saved }"
      ><Icon name="bookmark" :size="20" /><span>{{ $t('收藏') }}</span></RouterLink
    ><RouterLink to="/account" :class="{ active: route.path === '/account' }"
      ><Icon name="user" :size="20" /><span>{{ $t('我的') }}</span></RouterLink
    >
  </nav>
  <footer class="footer">
    <div>
      <RouterLink to="/" class="brand">smartfit<span class="brand-dot">®</span></RouterLink>
      <p>{{ $t('風格不設限。合身，由你定義。') }}</p>
      <small>DESIGNED AROUND YOU.</small>
    </div>
    <div class="footer-links">
      <RouterLink to="/studio">{{ $t('開始訂製') }}</RouterLink
      ><RouterLink to="/community">{{ $t('穿搭社群') }}</RouterLink
      ><RouterLink to="/orders">{{ $t('訂單追蹤') }}</RouterLink
      ><RouterLink to="/account">{{ $t('帳戶與隱私') }}</RouterLink
      ><RouterLink to="/credits">{{ $t('攝影與模型來源') }}</RouterLink>
    </div>
    <div class="footer-bottom">
      <span>© 2026 SmartFit · v{{ release.version }}. All styles welcome.</span
      ><span>{{ $t('SEEM5760 展示版本 · 付款與外部服務為模擬') }}</span>
    </div>
  </footer>
  <div v-if="store.state.toast" :class="['toast', { error: store.state.error }]" role="status">
    <Icon :name="store.state.error ? 'close' : 'check'" />{{ $t(store.state.toast)
    }}<button
      class="icon-button"
      :aria-label="$t('關閉提示')"
      @click="store.commit('toast', { message: '' })"
    >
      <Icon name="close" :size="16" />
    </button>
  </div>
</template>
