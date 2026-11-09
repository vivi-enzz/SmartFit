import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
test('local HTTP does not instruct Safari to upgrade scripts to unavailable HTTPS', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-http-')),
    app = createApp({ dataDir: dir, httpsOnly: false });
  try {
    const r = await request(app).get('/api/health');
    assert.doesNotMatch(r.headers['content-security-policy'], /upgrade-insecure-requests/);
    assert.match(r.headers['content-security-policy'], /script-src 'self'/);
    assert.match(r.headers['content-security-policy'], /object-src 'none'/);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test('HTTPS production retains insecure-resource upgrade protection', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-https-')),
    app = createApp({ dataDir: dir, httpsOnly: true });
  try {
    const r = await request(app).get('/api/health');
    assert.match(r.headers['content-security-policy'], /upgrade-insecure-requests/);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
