import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { i18n, setLocale, locale } from './i18n';
import store from './store';
import './style.css';
import './refinements.css';
import './shopping.css';
const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, saved) {
    return saved || { top: 0 };
  },
  routes: [
    { path: '/', component: () => import('./views/Home.vue') },
    { path: '/studio/:id?', component: () => import('./views/Studio.vue') },
    { path: '/designs', component: () => import('./views/Designs.vue'), meta: { auth: true } },
    { path: '/community', component: () => import('./views/Community.vue') },
    { path: '/community/:id', component: () => import('./views/Post.vue') },
    {
      path: '/checkout/:id',
      component: () => import('./views/Checkout.vue'),
      meta: { auth: true },
    },
    { path: '/orders/:id?', component: () => import('./views/Orders.vue'), meta: { auth: true } },
    { path: '/partners', component: () => import('./views/Partners.vue') },
    { path: '/credits', component: () => import('./views/Credits.vue') },
    { path: '/account', component: () => import('./views/Account.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('./views/NotFound.vue') },
  ],
});
router.beforeEach(async (to) => {
  if (!store.state.ready) {
    try {
      await store.dispatch('init');
    } catch (e) {
      store.commit('toast', { message: e.message, error: true });
    }
  }
  if (to.meta.auth && !store.state.user) return { path: '/account', query: { next: to.fullPath } };
});
setLocale(locale.value);
createApp(App).use(i18n).use(store).use(router).mount('#app');
