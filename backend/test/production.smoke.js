import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
test('production server serves compiled SPA, nested routes, assets and API on same origin', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-prod-')),
    app = createApp({ dataDir: dir });
  try {
    const home = await request(app).get('/');
    assert.equal(home.status, 200);
    assert.match(home.text, /<title>SmartFit/);
    assert.match(home.headers['content-type'], /text\/html/);
    assert.equal((await request(app).get('/studio')).status, 200);
    const asset = home.text.match(/src="([^"]+\.js)"/)[1];
    const js = await request(app).get(asset);
    assert.equal(js.status, 200);
    assert.match(js.headers['content-type'], /javascript/);
    assert.equal((await request(app).get('/api/health')).body.mode, 'demo');
    assert.equal((await request(app).get('/api/not-found')).status, 404);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
