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

export async function renderGarment(config) {
  const component = (await import('../src/components/GarmentArt.vue')).default;
  return renderToString(createSSRApp(component, { config }).use(i18n));
}

// Run real setup/watch/lifecycle code without a browser or WebGL renderer.
export async function mountStudio(path = '/studio', user = null) {
  const { createRenderer, nextTick, ssrContextKey } = await import('vue');
  const component = (await pages['../src/views/Studio.vue']()).default;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  });
  await router.push(path);
  await router.isReady();
  const renderer = createRenderer({
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    insert() {},
    remove() {},
    setText() {},
    setElementText() {},
    parentNode() {},
    nextSibling() {},
    patchProp() {},
  });
  const app = renderer.createApp({ ...component, render: () => null });
  app
    .use(i18n)
    .use(router)
    .use(createStore({ state: { user }, mutations: { toast() {} } }));
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  await nextTick();
  await nextTick();
  return { state: app._instance.setupState, router, flush: nextTick, close: () => app.unmount() };
}
