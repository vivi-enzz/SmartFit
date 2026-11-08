import { ref } from 'vue';
import en from './locales/en.json' with { type: 'json' };
import zh from './locales/zh-Hant.json' with { type: 'json' };
export const preferredLocale = (value) => (value === 'en' ? 'en' : 'zh-Hant');
let saved;
try {
  saved = globalThis.localStorage?.getItem('smartfit-locale');
} catch {}
export const locale = ref(preferredLocale(saved));
export function setLocale(value) {
  locale.value = preferredLocale(value);
  try {
    globalThis.localStorage?.setItem('smartfit-locale', locale.value);
  } catch {}
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale.value;
    document.title =
      locale.value === 'en' ? 'SmartFit — Wear your next self.' : 'SmartFit — 穿出你的下一個版本。';
  }
}
export function translate(value, language = locale.value) {
  if (typeof value !== 'string') return value;
  const dict = language === 'en' ? en : zh;
  const exact = dict[value] ?? dict[value.trim()];
  if (exact !== undefined) return exact;
  const patterns = [
    [/^已推进演示进度：(.*)$/, 'Demo progress updated: ', '示範進度已更新：'],
    [/^选择颜色 (#[0-9a-f]{6})$/i, 'Choose colour ', '選擇顏色 '],
    [/^模拟通知：(.*)$/, 'Demo notification: ', '模擬通知：'],
  ];
  for (const [pattern, english, traditional] of patterns) {
    const match = value.match(pattern);
    if (match) return (language === 'en' ? english : traditional) + translate(match[1], language);
  }
  return value;
}
export const i18n = {
  install(app) {
    app.config.globalProperties.$t = translate;
    app.provide('smartfit-locale', locale);
  },
};
