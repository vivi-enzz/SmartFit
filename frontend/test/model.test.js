import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodyScale, validMetrics, statusLabel, estimatePrice } from '../src/model.js';
test('body proportions change with measurements and remain bounded', () => {
  assert.ok(
    bodyScale({ height: 180, bust: 100, waist: 80, hip: 105 }).height >
      bodyScale({ height: 160, bust: 80, waist: 60, hip: 85 }).height
  );
  assert.equal(bodyScale({ height: NaN }).height, 1);
});
test('metric ranges reject blank, NaN and out of range values', () => {
  assert.equal(validMetrics({ height: 168, bust: 88, waist: 68, hip: 94 }), true);
  assert.equal(validMetrics({ height: '', bust: 88, waist: 68, hip: 94 }), false);
  assert.equal(validMetrics({ height: 168, bust: 88, waist: 500, hip: 94 }), false);
});
test('order state labels and price estimates are deterministic', () => {
  assert.equal(statusLabel('pending_payment'), '待付款');
  assert.equal(statusLabel('delivered'), '已签收');
  assert.equal(
    estimatePrice({ garmentType: 'dress', fabricId: 'linen', embroidery: 'none', length: 'midi' }),
    89800
  );
});
