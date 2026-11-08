import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caption } from '../src/adapters.js';
test('caption templates follow the selected interface language', () => {
  const english = caption({ fabricId: 'linen' }, false, 'en');
  assert.match(english.caption, /linen/i);
  assert.ok(!/[\u3400-\u9fff]/.test(english.caption));
  const zh = caption({ fabricId: 'linen' }, false, 'zh-Hant');
  assert.match(zh.caption, /亞麻/);
  assert.ok(!zh.caption.includes('今天的灵感'));
});
