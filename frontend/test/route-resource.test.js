import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectScope, ref, nextTick } from 'vue';
import { useRouteResource } from '../src/routeResource.js';
const tick = async () => {
  await nextTick();
  await new Promise((resolve) => setImmediate(resolve));
};
test('changing route clears previous content and loads the new design/post', async () => {
  const scope = effectScope(),
    id = ref('A');
  let resource;
  scope.run(() => {
    resource = useRouteResource(
      () => id.value,
      async (id) => ({ id })
    );
  });
  await tick();
  assert.equal(resource.data.value.id, 'A');
  id.value = 'B';
  await nextTick();
  await tick();
  assert.equal(resource.data.value.id, 'B');
  scope.stop();
});
test('late previous response cannot overwrite a new checkout or post', async () => {
  const scope = effectScope(),
    id = ref('A');
  let oldResolve, resource;
  scope.run(() => {
    resource = useRouteResource(
      () => id.value,
      (id) =>
        id === 'A'
          ? new Promise((r) => {
              oldResolve = r;
            })
          : Promise.resolve({ id })
    );
  });
  id.value = 'B';
  await tick();
  assert.equal(resource.data.value.id, 'B');
  oldResolve({ id: 'A' });
  await tick();
  assert.equal(resource.data.value.id, 'B');
  scope.stop();
});
test('failed navigation exposes an error without stale private content', async () => {
  const scope = effectScope(),
    id = ref('A');
  let resource;
  scope.run(() => {
    resource = useRouteResource(
      () => id.value,
      async (id) => {
        if (id === 'B') throw Error('无权访问');
        return { id };
      }
    );
  });
  await tick();
  id.value = 'B';
  await tick();
  assert.equal(resource.data.value, null);
  assert.equal(resource.error.value, '无权访问');
  assert.equal(resource.loading.value, false);
  scope.stop();
});
