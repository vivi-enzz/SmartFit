import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { defaults, validateConfig, estimatePrice } from '../../shared/catalog.js';
import { createGarments } from '../src/atelier/garments.js';
const hoodie = {
  ...defaults,
  garmentType: 'hoodie',
  length: 'short',
  sleeve: 'long',
  collar: 'round',
  fabricId: 'cotton',
};
test('hoodies have a distinct server-shared price and reject unsupported necklines or skirts', () => {
  assert.equal(validateConfig(hoodie), null);
  assert.equal(estimatePrice(hoodie), 69800);
  for (const patch of [
    { length: 'maxi' },
    { sleeve: 'sleeveless' },
    { collar: 'square' },
    { construction: 'tiered' },
  ])
    assert.ok(validateConfig({ ...hoodie, ...patch }));
  assert.equal(estimatePrice(defaults), 89800);
});
test('hoodie assembly includes an open hood, pocket, drawstrings and ribbed cuffs with finite geometry', () => {
  const g = createGarments(T, hoodie, {}, new Map());
  for (const name of [
    'hood-shell',
    'kangaroo-pocket',
    'hood-drawstring',
    'ribbed-cuff',
    'ribbed-hem',
  ])
    assert.ok(g.getObjectByName(name), name);
  g.traverse((o) => {
    if (o.isMesh)
      for (const x of o.geometry.attributes.position.array) assert.ok(Number.isFinite(x));
  });
});
