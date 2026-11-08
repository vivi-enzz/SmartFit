import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createDevelopmentApp } from '../src/development.js';
test('default development serves live Vue and authenticated API on a single origin', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-unified-'));
  const dev = await createDevelopmentApp({ dataDir: dir, hmr: false });
  try {
    const page = await request(dev.app).get('/account');
    assert.equal(page.status, 200);
    assert.match(page.text, /\/@vite\/client/);
    const response = await request(dev.app)
      .post('/api/auth/demo')
      .set('Host', 'localhost:5173')
      .set('Origin', 'http://localhost:5173');
    assert.equal(response.status, 200);
    const cookie = response.headers['set-cookie'].map((v) => v.split(';')[0]).join('; ');
    assert.equal((await request(dev.app).get('/api/designs').set('Cookie', cookie)).status, 200);
    for (const origin of ['https://attacker.example', 'null'])
      assert.equal(
        (
          await request(dev.app)
            .post('/api/auth/demo')
            .set('Host', 'localhost:5173')
            .set('Origin', origin)
        ).status,
        403
      );
  } finally {
    await dev.close();
    dev.app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
