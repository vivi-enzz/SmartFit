import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDesignHistory } from '../src/designHistory.js';
test('design history restores changes, clears redo branches and ignores identical snapshots', () => {
  const h = createDesignHistory({ color: 'red' });
  h.record({ color: 'blue' });
  h.record({ color: 'blue' });
  assert.deepEqual(h.undo(), { color: 'red' });
  assert.equal(h.canUndo, false);
  assert.equal(h.canRedo, true);
  assert.deepEqual(h.redo(), { color: 'blue' });
  h.undo();
  h.record({ color: 'green' });
  assert.equal(h.canRedo, false);
  const value = h.undo();
  value.color = 'bad';
  assert.deepEqual(h.redo(), { color: 'green' });
});
test('route resets isolate history and retain at most forty undo steps', () => {
  const h = createDesignHistory({ n: 0 });
  for (let n = 1; n <= 50; n++) h.record({ n });
  for (let n = 0; n < 40; n++) h.undo();
  assert.equal(h.canUndo, false);
  assert.deepEqual(h.current, { n: 10 });
  h.reset({ n: 100 });
  assert.equal(h.canRedo, false);
  assert.equal(h.canUndo, false);
});
