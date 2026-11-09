import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createMannequin } from '../src/atelier/mannequin.js';
import { createGarments } from '../src/atelier/garments.js';
import { fabricSpec, createTextile } from '../src/atelier/materials.js';
import { defaults } from '../../shared/catalog.js';
test('new dress form is deliberately featureless rather than a simulated human face', () => {
  const model = createMannequin(THREE, {});
  assert.ok(model.getObjectByName('featureless-head'));
  const names = [];
  model.traverse((o) => names.push(o.name));
  assert.ok(!names.some((n) => /eye|lip|hair|finger/.test(n)));
});
test('layer and skirt constructions produce separate, finite garment geometry', () => {
  const textures = new Map();
  const classic = createGarments(THREE, { ...defaults, construction: 'classic' }, {}, textures);
  const layered = createGarments(
    THREE,
    { ...defaults, construction: 'tiered', layer: 'cropped-jacket' },
    {},
    textures
  );
  assert.ok(layered.getObjectByName('outer-layer'));
  assert.ok(layered.children.length > classic.children.length);
  for (const group of [classic, layered])
    group.traverse((o) => {
      if (o.isMesh) {
        const pos = o.geometry.attributes.position;
        assert.ok(pos.count >= 3);
        for (const v of pos.array) assert.ok(Number.isFinite(v));
      }
    });
});
test('silk, linen and wool use distinct material and micro-weave responses', () => {
  assert.ok(fabricSpec('silk').roughness < fabricSpec('wool').roughness);
  const linen = createTextile(THREE, 'linen'),
    wool = createTextile(THREE, 'wool');
  assert.notDeepEqual(linen.bump.image.data, wool.bump.image.data);
  assert.ok(new Set(linen.bump.image.data).size > 10);
});

test('primary fabric normals face outwards for correct satin lighting', () => {
  const model = createGarments(THREE, { ...defaults }, {}, new Map());
  const mesh = model.getObjectByName('main-garment');
  assert.ok(mesh.geometry.attributes.position.count > 3000);
  assert.ok(mesh.geometry.attributes.normal.getZ(35 * 113) > 0.5);
});
test('tailored lapels follow a larger bust instead of disappearing inside the jacket', () => {
  const model = createGarments(
    THREE,
    { ...defaults, layer: 'cropped-jacket' },
    { bust: 140 },
    new Map()
  );
  const lapel = model.getObjectByName('tailored-lapel');
  const box = new THREE.Box3().setFromObject(lapel);
  assert.ok(box.max.z > 0.28);
});
