import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapPoints, mapCenter, mapLink } from '../src/mapModel.js';
test('map points use real geographic coordinates and reject invalid records', () => {
  const p = mapPoints([
    { id: 'hk', lat: 22.2815, lon: 114.1578, name: 'Demo' },
    { id: 'bad', lat: NaN, lon: 200 },
  ]);
  assert.deepEqual(p[0].coordinates, [22.2815, 114.1578]);
  assert.equal(p.length, 1);
  assert.deepEqual(mapCenter('Hong Kong'), [22.2855, 114.1635]);
  assert.match(mapLink([22.2855, 114.1635]), /^https:\/\/www.openstreetmap.org\//);
});
