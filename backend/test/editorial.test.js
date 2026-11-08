import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
test('photographic editorial content is attributed and upgrades preserve existing user posts', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-edit-'));
  let app = createApp({ dataDir: dir });
  try {
    let feed = (await request(app).get('/api/posts')).body.posts;
    assert.ok(feed.filter((p) => p.editorial && p.imageUrl?.startsWith('/editorial/')).length >= 8);
    assert.ok(feed.filter((p) => p.editorial).every((p) => p.credit?.source === 'Unsplash'));
    const agent = request.agent(app);
    await agent.post('/api/auth/demo');
    const post = await agent
      .post('/api/posts')
      .send({ caption: 'My original outfit', category: 'daily' });
    assert.equal(post.status, 201);
    app.locals.close();
    app = createApp({ dataDir: dir });
    feed = (await request(app).get('/api/posts')).body.posts;
    assert.ok(feed.some((p) => p.id === post.body.id && p.caption === 'My original outfit'));
    assert.equal(feed.filter((p) => p.editorial).length, 10);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test('English style and fabric searches find editorial inspiration', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'smartfit-search-')),
    app = createApp({ dataDir: dir });
  try {
    assert.ok((await request(app).get('/api/search?q=linen')).body.results.length > 0);
    assert.ok((await request(app).get('/api/posts?q=city')).body.posts.length > 0);
  } finally {
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
