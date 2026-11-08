<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import Icon from './components/Icon.vue';
import { api } from './api';
const store = useStore(),
  route = useRoute(),
  router = useRouter(),
  menu = ref(false),
  q = ref(''),
  results = ref([]),
  searchOpen = ref(false);
let timer, toastTimer;
watch(
  () => route.fullPath,
  () => {
    menu.value = false;
    searchOpen.value = false;
  }
);
watch(q, (v) => {
  clearTimeout(timer);
  if (!v.trim()) {
    results.value = [];
    return;
  }
  timer = setTimeout(async () => {
    try {
      results.value = (await api('/search?q=' + encodeURIComponent(v))).results;
      searchOpen.value = true;
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
  ['/', '发现灵感'],
  ['/studio', '定制工作室'],
  ['/community', '穿搭社区'],
  ['/partners', '附近服务'],
];
function search() {
  router.push({ path: '/community', query: { q: q.value } });
  searchOpen.value = false;
}
</script>
<template>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <div class="topnote">为你而制 · 按需生产 · 每一件都有自己的故事 <span>SEEM5760 演示版</span></div>
  <header class="header">
    <div class="nav-wrap">
      <RouterLink to="/" class="brand" aria-label="SmartFit 首页"
        ><span class="brand-mark">s<span>f</span></span
        >SmartFit<span class="brand-dot">.</span></RouterLink
      >
      <nav class="desktop-nav" aria-label="主导航">
        <RouterLink
          v-for="[url, label] in nav"
          :key="url"
          :to="url"
          :class="{ active: url === '/' ? route.path === '/' : route.path.startsWith(url) }"
          >{{ label }}</RouterLink
        >
      </nav>
      <div class="nav-actions">
        <div class="search-wrap">
          <form class="search" @submit.prevent="search">
            <Icon name="search" :size="17" /><input
              v-model="q"
              aria-label="搜索穿搭与面料"
              placeholder="搜索灵感、面料…"
              @focus="searchOpen = !!q"
              @keydown.esc="searchOpen = false"
            /><button class="sr-only">搜索</button>
          </form>
          <div v-if="searchOpen" class="search-results">
            <RouterLink v-for="r in results" :key="r.id" :to="'/community/' + r.id">{{
              r.title
            }}</RouterLink>
            <p v-if="!results.length">没有匹配结果，试试“亚麻”。</p>
            <button class="text-button" @click="searchOpen = false">关闭</button>
          </div>
        </div>
        <RouterLink to="/designs" class="icon-button" aria-label="我的设计"
          ><Icon name="bag" /></RouterLink
        ><RouterLink to="/account" class="avatar" aria-label="账户">{{
          store.state.user ? store.state.user.name.slice(0, 1) : 'S'
        }}</RouterLink
        ><button
          class="icon-button mobile-menu"
          aria-label="展开导航"
          :aria-expanded="menu"
          @click="menu = !menu"
        >
          <Icon :name="menu ? 'close' : 'menu'" />
        </button>
      </div>
    </div>
    <nav v-if="menu" class="mobile-nav" aria-label="移动导航">
      <RouterLink
        v-for="[url, label] in [...nav, ['/designs', '我的设计'], ['/orders', '我的订单']]"
        :key="url"
        :to="url"
        >{{ label }}</RouterLink
      >
    </nav>
  </header>
  <main id="main" tabindex="-1"><RouterView /></main>
  <footer class="footer">
    <RouterLink to="/" class="brand">SmartFit.</RouterLink>
    <p>合身，自有风格。<span>Made for you. Mindfully.</span></p>
    <div>
      <RouterLink to="/designs">我的设计</RouterLink><RouterLink to="/orders">我的订单</RouterLink
      ><RouterLink to="/account">账户与隐私</RouterLink>
    </div>
    <small>© 2026 SmartFit · SEEM5760 课程演示 · 全部支付与外部服务均为模拟</small>
  </footer>
  <div v-if="store.state.toast" :class="['toast', { error: store.state.error }]" role="status">
    <Icon :name="store.state.error ? 'close' : 'check'" />{{ store.state.toast
    }}<button
      class="icon-button"
      aria-label="关闭提示"
      @click="store.commit('toast', { message: '' })"
    >
      <Icon name="close" :size="16" />
    </button>
  </div>
</template>
