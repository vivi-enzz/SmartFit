import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate, locale, setLocale, preferredLocale } from '../src/i18n.js';
test('Traditional Chinese and English are actual localized text, not a font substitution', () => {
  assert.equal(translate('发现灵感', 'en'), 'Discover');
  assert.equal(translate('定制工作室', 'zh-Hant'), '訂製工作室');
  assert.equal(
    translate('不允许跨站提交', 'en'),
    'This request could not be verified. Please reopen the app using the address shown in your terminal.'
  );
});
test('locale preferences are validated and switching is reactive', () => {
  assert.equal(preferredLocale('en'), 'en');
  assert.equal(preferredLocale('bad'), 'zh-Hant');
  setLocale('en');
  assert.equal(locale.value, 'en');
  setLocale('zh-Hant');
  assert.equal(translate(42), 42);
});
test('dynamic order notifications and accessible colour labels localize their fixed parts', () => {
  assert.equal(translate('已推进演示进度：已发货', 'en'), 'Demo progress updated: Shipped');
  assert.equal(translate('选择颜色 #8C9B82', 'en'), 'Choose colour #8C9B82');
  assert.equal(translate('模拟通知：已签收', 'en'), 'Demo notification: Delivered');
});
import english from '../src/locales/en.json' with { type: 'json' };
import traditional from '../src/locales/zh-Hant.json' with { type: 'json' };
test('every registered interface phrase has an English and Traditional Chinese translation', () => {
  for (const key of Object.keys(traditional)) {
    assert.ok(english[key], `Missing English: ${key}`);
    assert.ok(
      key === '繁' || !/[\u3400-\u9fff]/.test(english[key]),
      `Untranslated English: ${key}`
    );
  }
});
