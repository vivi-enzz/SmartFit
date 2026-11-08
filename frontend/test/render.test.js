import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
// SSR compiles the same Vue templates as the production client; no browser or network server is launched.
const { renderPage } = await server.ssrLoadModule('/test/render-fixture.js');
for (const [page, needle] of [
  ['Home', '让衣服'],
  ['Studio', '服装设计'],
  ['Account', '一键体验'],
  ['Community', '全部灵感'],
  ['Designs', '我的设计'],
  ['Checkout', '离专属作品'],
  ['Orders', '我的订单'],
  ['Partners', '服务'],
  ['NotFound', '404'],
]) {
  test(`Vue page ${page} compiles and renders its main content`, async () => {
    const html = await renderPage(page);
    assert.ok(html.includes(needle), `${page} should contain ${needle}`);
    assert.ok(!html.includes('[object Object]'));
  });
}
