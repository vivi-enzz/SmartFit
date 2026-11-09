import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deformBodyPosition } from '../src/avatarShape.js';
test('legacy licensed anatomical mesh remains a valid archival asset', () => {
  const b = readFileSync(new URL('../public/models/atelier-body.glb', import.meta.url));
  assert.equal(b.readUInt32LE(0), 0x46546c67);
  const n = b.readUInt32LE(12),
    g = JSON.parse(b.subarray(20, 20 + n).toString());
  assert.ok(g.accessors[0].count > 10000);
  assert.ok(g.accessors[2].count > 60000);
  assert.match(g.asset.copyright, /CC0/);
});
test('height and circumference affect anatomical body without stretching the face', () => {
  assert.ok(deformBodyPosition([0.15, 1.2, 0.1], { height: 180, waist: 85 })[0] > 0.15);
  assert.equal(deformBodyPosition([0.05, 1.85, 0.1], { waist: 100, bust: 120 })[0], 0.05);
  assert.ok(deformBodyPosition([0.05, 1.85, 0.1], { height: 180 })[1] > 1.85);
});

import { necklineY } from '../src/avatarShape.js';
test('neck styles change the actual front garment edge, including with different bust widths', () => {
  assert.ok(necklineY(0, 0.2, 1.555, 'v-neck') < necklineY(0, 0.2, 1.555, 'round'));
  assert.ok(necklineY(0.03, 0.2, 1.555, 'square') < 1.5);
  assert.equal(necklineY(0, -0.2, 1.555, 'v-neck'), 1.555);
  assert.equal(necklineY(0.2, 0.2, 1.555, 'v-neck'), 1.555);
});
