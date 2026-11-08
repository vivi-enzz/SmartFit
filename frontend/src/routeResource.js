import { ref, watch, onScopeDispose } from 'vue';
// Reused route components must not display or act on a previous route's resource.
export function useRouteResource(source, loader) {
  const data = ref(null),
    error = ref(''),
    loading = ref(false);
  let generation = 0;
  async function reload() {
    const current = ++generation,
      id = source();
    data.value = null;
    error.value = '';
    loading.value = true;
    try {
      const result = await loader(id);
      if (current === generation) data.value = result;
    } catch (e) {
      if (current === generation) error.value = e.message;
    } finally {
      if (current === generation) loading.value = false;
    }
  }
  watch(source, reload, { immediate: true });
  onScopeDispose(() => {
    generation++;
  });
  return { data, error, loading, reload };
}
