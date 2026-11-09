import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
// SSR compiles the same Vue templates as the production client; no browser or network server is launched.
const { renderPage } = await server.ssrLoadModule('/test/render-fixture.js');
for (const [page, needle] of [
  ['Home', '下一個版本'],
  ['Studio', '服裝設計'],
  ['Account', '一鍵體驗'],
  ['Community', '全部靈感'],
  ['Designs', '我的設計'],
  ['Checkout', '離專屬作品'],
  ['Orders', '我的訂單'],
  ['Partners', '服務'],
  ['NotFound', '404'],
  ['Credits', '清晰來源'],
]) {
  test(`Vue page ${page} compiles and renders its main content`, async () => {
    const html = await renderPage(page);
    assert.ok(html.includes(needle), `${page} should contain ${needle}`);
    assert.ok(!html.includes('[object Object]'));
  });
}

test('English renders the commercial home and account forms', async () => {
  const home = await renderPage('Home', 'en');
  assert.ok(home.includes('next self.'));
  const account = await renderPage('Account', 'en');
  assert.ok(account.includes('Try the Full Demo'));
  assert.ok(account.includes('Email'));
});

test('2D purchase and fallback previews retain new construction and layer colours', async () => {
  const { renderGarment } = await server.ssrLoadModule('/test/render-fixture.js');
  for (const construction of ['pleated', 'wrap', 'tiered']) {
    const html = await renderGarment({
      construction,
      layer: 'cropped-jacket',
      accentColor: '#123456',
    });
    assert.ok(html.includes('data-construction="' + construction + '"'));
    assert.ok(html.includes('data-layer="cropped-jacket"'));
    assert.ok(html.includes('#123456'));
  }
  const classic = await renderGarment({});
  assert.ok(!classic.includes('data-layer='));
});
