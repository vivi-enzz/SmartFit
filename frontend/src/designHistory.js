// Plain snapshots keep undo independent of Vue proxies and mutable form objects.
const clone = (value) => JSON.parse(JSON.stringify(value));
export function createDesignHistory(initial, limit = 40) {
  let past = [],
    future = [],
    current = clone(initial);
  return {
    get current() {
      return clone(current);
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    reset(value) {
      current = clone(value);
      past = [];
      future = [];
    },
    record(value) {
      if (JSON.stringify(value) === JSON.stringify(current)) return;
      past.push(current);
      past = past.slice(-limit);
      current = clone(value);
      future = [];
    },
    undo() {
      if (past.length) {
        future.push(current);
        current = past.pop();
      }
      return clone(current);
    },
    redo() {
      if (future.length) {
        past.push(current);
        current = future.pop();
      }
      return clone(current);
    },
  };
}
