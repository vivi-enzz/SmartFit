import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
test('map and explicit social embeds have narrow CSP and a usable tile Referer policy', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sf-map-policy-')),
    app = createApp({ dataDir: dir });
  try {
    const r = await request(app).get('/api/health');
    assert.match(
      r.headers['content-security-policy'],
      /img-src[^;]*https:\/\/tile.openstreetmap.org/
    );
    assert.match(r.headers['content-security-policy'], /frame-src[^;]*https:\/\/www.instagram.com/);
    assert.equal(r.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.doesNotMatch(r.headers['content-security-policy'], /upgrade-insecure-requests/);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
