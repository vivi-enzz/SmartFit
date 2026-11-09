import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanSavedLooks, savedKey } from '../src/collections.js';
import { instagramEmbedUrl } from '../src/socialSources.js';
test('saved inspiration is bounded, deduplicated and scoped to the signed-in user', () => {
  assert.deepEqual(cleanSavedLooks(['seed-1', 'seed-1', null, {}, 'idol-lisa']), [
    'seed-1',
    'idol-lisa',
  ]);
  assert.notEqual(savedKey('a'), savedKey('b'));
  assert.equal(cleanSavedLooks(Array.from({ length: 300 }, (_, i) => 'post-' + i)).length, 200);
});
test('social embed URLs permit only real Instagram post paths, not arbitrary URLs', () => {
  assert.equal(
    instagramEmbedUrl('https://www.instagram.com/p/DGnQpYNJGHT/'),
    'https://www.instagram.com/p/DGnQpYNJGHT/embed/'
  );
  for (const url of [
    'javascript:alert(1)',
    'https://attacker.example/p/abc/',
    'https://www.instagram.com/accounts/login/',
  ])
    assert.equal(instagramEmbedUrl(url), null);
});
