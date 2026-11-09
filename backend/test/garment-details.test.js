import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { defaults, estimatePrice, validateConfig } from '../../shared/catalog.js';
test('new layered garment details preserve old prices and validate supported combinations', () => {
  const old = { ...defaults };
  delete old.construction;
  delete old.layer;
  delete old.accentColor;
  assert.equal(estimatePrice(old), 89800);
  assert.equal(
    validateConfig({ ...old, construction: 'tiered', garmentType: 'top', length: 'short' }),
    '分層裙襬僅適用於連衣裙'
  );
  assert.ok(validateConfig({ ...old, layer: 'unknown' }));
  assert.equal(estimatePrice({ ...old, construction: 'pleated', layer: 'cropped-jacket' }), 107800);
});
test('layered design parameters are saved in immutable order snapshots and server-priced', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sf-layers-')),
    app = createApp({ dataDir: dir });
  try {
    const a = request.agent(app);
    await a.post('/api/auth/demo');
    const config = {
      ...defaults,
      construction: 'wrap',
      layer: 'long-vest',
      accentColor: '#282828',
    };
    const d = await a.post('/api/designs').send({ name: 'Layered look', config, price: 1 });
    assert.equal(d.status, 201);
    assert.equal(d.body.config.construction, 'wrap');
    assert.equal(d.body.config.layer, 'long-vest');
    assert.equal(d.body.price, 102800);
    const o = await a.post('/api/orders').send({
      designId: d.body.id,
      idempotencyKey: 'layered-1',
      address: { name: 'Demo', phone: '12345678', line: 'Demo address Hong Kong' },
    });
    assert.equal(o.status, 201);
    assert.equal(o.body.snapshot.config.accentColor, '#282828');
    await a
      .put('/api/designs/' + d.body.id)
      .send({ name: 'Changed', config: { ...config, layer: 'none' } });
    assert.equal((await a.get('/api/orders/' + o.body.id)).body.snapshot.config.layer, 'long-vest');
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test('opening a legacy saved draft adds neutral defaults without changing its price', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sf-old-draft-')),
    app = createApp({ dataDir: dir });
  try {
    const a = request.agent(app);
    await a.post('/api/auth/demo');
    const d = await a.post('/api/designs').send({ name: 'Old draft', config: defaults });
    const old = { ...defaults };
    delete old.construction;
    delete old.layer;
    delete old.accentColor;
    app.locals.db
      .prepare('UPDATE designs SET config=? WHERE id=?')
      .run(JSON.stringify(old), d.body.id);
    const r = await a.get('/api/designs/' + d.body.id);
    assert.equal(r.body.config.construction, 'classic');
    assert.equal(r.body.config.layer, 'none');
    assert.equal(r.body.price, 89800);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('hoodie order snapshots retain garment type and reject unsupported hoodie combinations', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sf-hoodie-')),
    app = createApp({ dataDir: dir });
  try {
    const a = request.agent(app);
    await a.post('/api/auth/demo');
    const config = {
      ...defaults,
      garmentType: 'hoodie',
      fabricId: 'cotton',
      length: 'short',
      sleeve: 'long',
    };
    const d = await a.post('/api/designs').send({ name: 'Everyday hoodie', config, price: 1 });
    assert.equal(d.status, 201);
    assert.equal(d.body.price, 69800);
    const invalid = await a
      .post('/api/designs')
      .send({ name: 'Bad hoodie', config: { ...config, collar: 'square' } });
    assert.equal(invalid.status, 400);
    const o = await a.post('/api/orders').send({
      designId: d.body.id,
      idempotencyKey: 'hoodie-1',
      address: { name: 'Demo', phone: '12345678', line: 'Demo address Hong Kong' },
    });
    assert.equal(o.status, 201);
    assert.equal(o.body.snapshot.config.garmentType, 'hoodie');
    assert.equal(o.body.amount, 69800);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
