import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-'));
let app, a, b, design, order;
const config = {
  garmentType: 'dress',
  silhouette: 'A-line',
  collar: 'round',
  sleeve: 'short',
  length: 'midi',
  fabricId: 'linen',
  colorHex: '#8C9B82',
  embroidery: 'none',
};
before(() => {
  app = createApp({ dataDir: dir });
  a = request.agent(app);
  b = request.agent(app);
});
after(() => {
  app.locals.close?.();
  rmSync(dir, { recursive: true, force: true });
});
test('anonymous protected routes require authentication', async () => {
  assert.equal((await request(app).get('/api/designs')).status, 401);
});
test('demo sessions are isolated and cookie is HttpOnly', async () => {
  const x = await a.post('/api/auth/demo');
  const y = await b.post('/api/auth/demo');
  assert.equal(x.status, 200);
  assert.notEqual(x.body.user.id, y.body.user.id);
  assert.match(x.headers['set-cookie'][0], /HttpOnly/);
});
test('register normalizes email, rejects duplicate and supports login/logout', async () => {
  const c = request.agent(app);
  const body = { name: '测试用户', email: 'Test@Example.com', password: 'StrongPass!123' };
  assert.equal((await c.post('/api/auth/register').send(body)).status, 201);
  assert.equal((await c.post('/api/auth/register').send(body)).status, 409);
  await c.post('/api/auth/logout');
  assert.equal((await c.get('/api/designs')).status, 401);
  assert.equal((await c.post('/api/auth/login').send({ ...body, password: 'wrong' })).status, 401);
  assert.equal(
    (await c.post('/api/auth/login').send({ ...body, email: 'test@example.com' })).status,
    200
  );
});
test('catalogue and weather fallback expose three recommendations', async () => {
  assert.ok((await a.get('/api/catalog')).body.fabrics.length >= 3);
  const r = await a.get('/api/homepage-recommendations?city=Hong%20Kong&simulateFailure=1');
  assert.equal(r.status, 200);
  assert.equal(r.body.source, 'fallback');
  assert.ok(r.body.fabrics.length >= 3);
});
test('design validates combinations, colors and server-side prices', async () => {
  assert.equal(
    (
      await a
        .post('/api/designs')
        .send({ name: '我的裙装', config: { ...config, colorHex: 'red' } })
    ).status,
    400
  );
  assert.equal(
    (
      await a
        .post('/api/designs')
        .send({ config: { ...config, garmentType: 'top', length: 'maxi' } })
    ).status,
    400
  );
  const r = await a.post('/api/designs').send({ name: '我的亚麻裙', config, price: 1 });
  assert.equal(r.status, 201);
  design = r.body;
  assert.ok(design.price > 10000);
  assert.equal((await b.get('/api/designs/' + design.id)).status, 404);
});
test('body metrics require consent, reject nonnumeric/range and encrypt storage', async () => {
  const metrics = { height: 168, bust: 88, waist: 68, hip: 94 };
  assert.equal((await a.put('/api/metrics').send({ metrics })).status, 400);
  assert.equal(
    (await a.put('/api/metrics').send({ consent: true, metrics: { ...metrics, height: 'NaN' } }))
      .status,
    400
  );
  assert.equal(
    (await a.put('/api/metrics').send({ consent: true, metrics: { ...metrics, waist: 500 } }))
      .status,
    400
  );
  assert.equal((await a.put('/api/metrics').send({ consent: true, metrics })).status, 200);
  assert.deepEqual((await a.get('/api/metrics')).body.metrics, metrics);
  const db = readFileSync(path.join(dir, 'smartfit.sqlite'));
  assert.ok(!db.includes(Buffer.from(JSON.stringify(metrics))));
});
test('create order requires address and idempotency preserves order snapshot', async () => {
  assert.equal((await a.post('/api/orders').send({ designId: design.id })).status, 400);
  const body = {
    designId: design.id,
    address: { name: '林女士', phone: '91234567', line: '香港中环示例街 10 号' },
    idempotencyKey: 'checkout-1',
  };
  const r = await a.post('/api/orders').send(body);
  assert.equal(r.status, 201);
  order = r.body;
  assert.equal((await a.post('/api/orders').send(body)).body.id, order.id);
  await a
    .put('/api/designs/' + design.id)
    .send({ name: '改过的裙装', config: { ...config, colorHex: '#112233' } });
  const saved = (await a.get('/api/orders/' + order.id)).body;
  assert.equal(saved.snapshot.config.colorHex, config.colorHex);
  assert.equal(saved.amount, design.price);
  assert.equal((await b.get('/api/orders/' + order.id)).status, 404);
});
test('payment failure can retry; duplicate payment events are idempotent', async () => {
  assert.equal((await a.post('/api/orders/' + order.id + '/advance')).status, 409);
  let r = await a
    .post('/api/orders/' + order.id + '/pay')
    .send({ outcome: 'failed', eventId: 'ev-fail' });
  assert.equal(r.body.status, 'pending_payment');
  r = await a
    .post('/api/orders/' + order.id + '/pay')
    .send({ outcome: 'success', eventId: 'ev-ok' });
  assert.equal(r.body.status, 'paid');
  r = await a
    .post('/api/orders/' + order.id + '/pay')
    .send({ outcome: 'success', eventId: 'ev-ok' });
  assert.equal(r.body.status, 'paid');
  assert.equal(r.body.history.filter((x) => x.status === 'paid').length, 1);
  assert.equal(
    (await b.post('/api/orders/' + order.id + '/pay').send({ outcome: 'success' })).status,
    404
  );
});
test('fulfillment progresses through controlled timeline; purchased design deletable', async () => {
  for (const s of ['in_production', 'shipped', 'delivered']) {
    assert.equal((await a.post('/api/orders/' + order.id + '/advance')).body.status, s);
  }
  assert.equal((await a.post('/api/orders/' + order.id + '/advance')).status, 409);
  await a.delete('/api/designs/' + design.id);
  const r = await a.get('/api/orders/' + order.id);
  assert.equal(r.body.snapshot.config.colorHex, config.colorHex);
  assert.ok(r.body.tracking.length >= 2);
});
test('community supports editable fallback caption, likes, comments and buy look', async () => {
  const cap = await a.post('/api/captions').send({ config, simulateFailure: true });
  assert.equal(cap.body.source, 'fallback');
  assert.ok(cap.body.caption);
  const d = (await a.post('/api/designs').send({ name: '分享设计', config })).body;
  const r = await a
    .post('/api/posts')
    .send({ designId: d.id, caption: '今天穿自己设计的亚麻裙！', category: 'daily' });
  assert.equal(r.status, 201);
  const id = r.body.id;
  assert.equal((await b.post('/api/posts/' + id + '/like')).body.liked, true);
  assert.equal((await b.post('/api/posts/' + id + '/like')).body.liked, false);
  assert.equal(
    (await b.post('/api/posts/' + id + '/comments').send({ content: '很有气质' })).status,
    201
  );
  const p = (await b.get('/api/posts/' + id)).body;
  assert.equal(p.comments.length, 1);
  assert.equal(p.config.fabricId, 'linen');
  assert.ok((await b.get('/api/search?q=亚麻')).body.results.length > 0);
});
test('uploads reject fake and oversize files and store valid reencoded images', async () => {
  assert.equal(
    (
      await a
        .post('/api/uploads')
        .attach('image', Buffer.from('fake'), { filename: 'a.png', contentType: 'image/png' })
    ).status,
    400
  );
  assert.equal(
    (
      await a.post('/api/uploads').attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'big.jpg',
        contentType: 'image/jpeg',
      })
    ).status,
    413
  );
  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#779977' } })
    .png()
    .toBuffer();
  const r = await a.post('/api/uploads').attach('image', png, 'a.png');
  assert.equal(r.status, 201);
  assert.match(r.body.url, /^\/media\/[a-f0-9-]+\.webp$/);
  assert.equal((await request(app).get(r.body.url)).status, 200);
  assert.equal(
    (await b.post('/api/posts').send({ caption: '不能借用他人未发布的照片', imageUrl: r.body.url }))
      .status,
    400
  );
});
test('partners validate coordinates, label demo results and filter five km', async () => {
  assert.equal((await a.get('/api/partners?lat=bad&lon=114')).status, 400);
  const r = await a.get('/api/partners?lat=22.281&lon=114.158');
  assert.equal(r.body.source, 'demo');
  assert.ok(r.body.partners.every((p) => p.distance <= 5));
});
test('export excludes credentials; metrics deletable; cross-origin mutations blocked', async () => {
  const r = await a.get('/api/account/export');
  assert.equal(r.status, 200);
  assert.equal(r.body.user.password, undefined);
  assert.ok(r.body.orders.length);
  await a.delete('/api/metrics');
  assert.equal((await a.get('/api/metrics')).body.metrics, null);
  assert.equal(
    (await a.post('/api/auth/demo').set('Origin', 'https://attacker.example')).status,
    403
  );
});
test('restart preserves users, orders and decryptable metrics', async () => {
  const metrics = { height: 172, bust: 92, waist: 72, hip: 98 };
  let c = request.agent(app);
  await c.post('/api/auth/login').send({ email: 'test@example.com', password: 'StrongPass!123' });
  await c.put('/api/metrics').send({ consent: true, metrics });
  const key = readFileSync(path.join(dir, 'secret.key'), 'utf8');
  app.locals.close();
  app = createApp({ dataDir: dir });
  assert.equal(readFileSync(path.join(dir, 'secret.key'), 'utf8'), key);
  c = request.agent(app);
  await c.post('/api/auth/login').send({ email: 'test@example.com', password: 'StrongPass!123' });
  assert.equal((await c.get('/api/auth/me')).body.user.name, '测试用户');
  assert.deepEqual((await c.get('/api/metrics')).body.metrics, metrics);
  assert.ok(app.locals.db.prepare('SELECT count(*) AS n FROM orders').get().n >= 1);
});
