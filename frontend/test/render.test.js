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

test('new studio and shopping controls render in both interface languages', async () => {
  for (const language of ['zh-Hant', 'en']) {
    const studio = await renderPage('Studio', language);
    assert.ok(studio.includes(language === 'en' ? 'Spatial Fitting Room' : '空間試衣間'));
    assert.ok(studio.includes(language === 'en' ? 'Undo' : '撤銷'));
    const home = await renderPage('Home', language);
    assert.ok(home.includes('shop-product-grid'));
    assert.ok(home.includes('/studio?product='));
  }
  const { renderGarment } = await server.ssrLoadModule('/test/render-fixture.js');
  const html = await renderGarment({ garmentType: 'hoodie', sleeve: 'long', length: 'short' });
  assert.ok(html.includes('data-garment="hoodie"'));
});

test('anonymous drafts survive login handoff and studio history restores the displayed configuration', async () => {
  const memory = new Map([
    [
      'smartfit-draft',
      JSON.stringify({
        config: {
          garmentType: 'top',
          colorHex: '#123456',
          length: 'short',
          construction: 'classic',
        },
        metrics: { height: 181, bust: 92, waist: 72, hip: 95 },
        name: 'My resumed design',
      }),
    ],
  ]);
  const previous = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    getItem: (k) => memory.get(k) || null,
    removeItem: (k) => memory.delete(k),
    setItem: (k, v) => memory.set(k, v),
  };
  let mounted;
  try {
    const { mountStudio } = await server.ssrLoadModule('/test/render-fixture.js');
    mounted = await mountStudio();
    const s = mounted.state;
    assert.equal(s.config.colorHex, '#123456');
    assert.equal(s.name, 'My resumed design');
    assert.equal(s.metrics.height, 181);
    s.config.colorHex = '#abcdef';
    await mounted.flush();
    assert.equal(s.canUndo, true);
    await s.restore('undo');
    assert.equal(s.config.colorHex, '#123456');
    assert.equal(s.canRedo, true);
    await s.restore('redo');
    assert.equal(s.config.colorHex, '#abcdef');
    await mounted.router.push('/studio?product=city-hoodie&color=%23112233');
    await mounted.flush();
    await mounted.flush();
    assert.equal(s.config.garmentType, 'hoodie');
    assert.equal(s.config.colorHex, '#112233');
    assert.equal(s.canUndo, false);
  } finally {
    mounted?.close();
    globalThis.sessionStorage = previous;
  }
});

test('product edits round-trip through login without a stale draft replacing a fresh product', async () => {
  const memory = new Map(),
    previous = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    getItem: (k) => memory.get(k) || null,
    removeItem: (k) => memory.delete(k),
    setItem: (k, v) => memory.set(k, v),
  };
  let a, b;
  try {
    const { mountStudio } = await server.ssrLoadModule('/test/render-fixture.js');
    a = await mountStudio('/studio?product=city-hoodie');
    a.state.config.colorHex = '#aa3344';
    await a.flush();
    await a.state.save();
    const next = a.router.currentRoute.value.query.next;
    assert.ok(next.includes('resume=1'));
    a.close();
    a = null;
    b = await mountStudio(next);
    assert.equal(b.state.config.colorHex, '#aa3344');
    assert.equal(b.state.config.garmentType, 'hoodie');
    b.close();
    b = null;
    memory.set(
      'smartfit-draft',
      JSON.stringify({ config: { colorHex: '#bbccdd' }, name: 'stale' })
    );
    b = await mountStudio('/studio?product=white-shirt');
    assert.notEqual(b.state.config.colorHex, '#bbccdd');
  } finally {
    a?.close();
    b?.close();
    globalThis.sessionStorage = previous;
  }
});

test('new route initialization disables old history while saved measurements are pending', async () => {
  const previousFetch = globalThis.fetch,
    previousStorage = globalThis.sessionStorage;
  let blocked = false,
    release,
    mounted;
  globalThis.sessionStorage = { getItem: () => null };
  globalThis.fetch = async () => {
    if (blocked)
      await new Promise((r) => {
        release = r;
      });
    return new Response(JSON.stringify({ metrics: null }), {
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    const { mountStudio } = await server.ssrLoadModule('/test/render-fixture.js');
    mounted = await mountStudio('/studio?product=white-shirt', { id: 'test-user' });
    for (let i = 0; i < 8; i++) await mounted.flush();
    const s = mounted.state;
    s.config.colorHex = '#abcdef';
    await mounted.flush();
    assert.equal(s.canUndo, true);
    blocked = true;
    await mounted.router.push('/studio?product=city-hoodie');
    await mounted.flush();
    assert.equal(s.canUndo, false);
    await s.restore('undo');
    assert.equal(s.config.garmentType, 'hoodie');
    release();
    for (let i = 0; i < 8; i++) await mounted.flush();
    assert.equal(s.config.garmentType, 'hoodie');
    assert.equal(s.canUndo, false);
  } finally {
    release?.();
    mounted?.close();
    globalThis.fetch = previousFetch;
    globalThis.sessionStorage = previousStorage;
  }
});
