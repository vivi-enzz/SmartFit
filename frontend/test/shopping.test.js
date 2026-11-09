import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { styleProducts, dailyEditorial, productConfig } from '../../shared/shopping.js';
import { validateConfig, estimatePrice } from '../../shared/catalog.js';
test('style recommendations have usable local photos and valid purchasable configurations', () => {
  assert.equal(styleProducts.length, 6);
  for (const p of styleProducts) {
    assert.equal(validateConfig(p.config), null, p.id);
    assert.ok(estimatePrice(p.config) >= 49800);
    assert.ok(existsSync('frontend/public' + p.imageUrl));
    assert.ok(p.credit.sourceUrl.startsWith('https://unsplash.com/photos/'));
    assert.ok(p.colors.length >= 3);
  }
  assert.equal(productConfig('not-real'), null);
  const c = productConfig(styleProducts[0].id, '#123456');
  assert.equal(c.colorHex, '#123456');
  assert.notEqual(styleProducts[0].config.colorHex, '#123456');
});
test('daily photography is explicitly editorial with attributable sources, never a fake user post', () => {
  assert.equal(dailyEditorial.length, 6);
  for (const p of dailyEditorial) {
    assert.equal(p.editorial, true);
    assert.equal(p.kind, 'daily');
    assert.ok(p.captionEn);
    assert.ok(p.credit.author);
    assert.equal(validateConfig(p.config), null);
  }
});
