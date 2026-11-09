import { createStore } from 'vuex';
import { api } from './api';
import { readSavedLooks, writeSavedLooks, cleanSavedLooks } from './collections';
export default createStore({
  state: { user: null, ready: false, toast: '', error: false, catalog: null, savedLooks: [] },
  mutations: {
    user(s, u) {
      s.user = u;
      s.savedLooks = readSavedLooks(u?.id);
    },
    toggleSaved(s, id) {
      if (!s.user) return;
      const old = s.savedLooks || [];
      s.savedLooks = old.includes(id) ? old.filter((x) => x !== id) : cleanSavedLooks([id, ...old]);
      writeSavedLooks(s.user.id, s.savedLooks);
    },
    ready(s) {
      s.ready = true;
    },
    catalog(s, c) {
      s.catalog = c;
    },
    toast(s, { message, error = false }) {
      s.toast = message;
      s.error = error;
    },
  },
  actions: {
    async init({ commit }) {
      const [auth, catalog] = await Promise.all([api('/auth/me'), api('/catalog')]);
      commit('user', auth.user);
      commit('catalog', catalog);
      commit('ready');
    },
    async demo({ commit }) {
      const r = await api('/auth/demo', { method: 'POST' });
      commit('user', r.user);
    },
    async logout({ commit }) {
      await api('/auth/logout', { method: 'POST' });
      commit('user', null);
    },
  },
});
