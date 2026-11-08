import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { createServer } from 'vite';
import viteConfig from '../../vite.config.js';
import { createApp } from '../src/app.js';

test('Vite proxy preserves browser origin for login and rejects genuinely foreign submissions', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-proxy-'));
  const api = createApp({ dataDir: dir });
  const backend = api.listen(0, '127.0.0.1');
  await once(backend, 'listening');
  const target = `http://127.0.0.1:${backend.address().port}`;
  const configured = viteConfig.server.proxy['/api'];
  const proxy = typeof configured === 'string' ? target : { ...configured, target };
  const vite = await createServer({
    ...viteConfig,
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
    server: { ...viteConfig.server, middlewareMode: true, proxy: { '/api': proxy } },
  });
  const web = express().use(vite.middlewares);
  try {
    for (const host of ['localhost:5173', '127.0.0.1:5174', '192.168.1.9:5173']) {
      const response = await request(web)
        .post('/api/auth/demo')
        .set('Host', host)
        .set('Origin', `http://${host}`);
      assert.equal(response.status, 200, `${host}: ${JSON.stringify(response.body)}`);
      assert.ok(response.body.user.demo);
      const cookie = response.headers['set-cookie'].map((value) => value.split(';')[0]).join('; ');
      const designs = await request(web)
        .get('/api/designs')
        .set('Host', host)
        .set('Cookie', cookie);
      assert.equal(designs.status, 200);
    }
    const foreign = await request(web)
      .post('/api/auth/demo')
      .set('Host', 'localhost:5173')
      .set('Origin', 'https://attacker.example');
    assert.equal(foreign.status, 403);
  } finally {
    await vite.close();
    await new Promise((resolve) => backend.close(resolve));
    api.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
