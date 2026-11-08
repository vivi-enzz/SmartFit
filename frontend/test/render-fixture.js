import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createStore } from 'vuex';
import { i18n, setLocale } from '../src/i18n';
const pages = import.meta.glob('../src/views/*.vue');
export async function renderPage(name, language = 'zh-Hant') {
  setLocale(language);
  const component = (await pages['../src/views/' + name + '.vue']()).default;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component }],
  });
  await router.push('/');
  await router.isReady();
  const store = createStore({
    state: { user: null, ready: true },
    mutations: { toast() {} },
    actions: {},
  });
  return renderToString(createSSRApp(component).use(i18n).use(router).use(store));
}
