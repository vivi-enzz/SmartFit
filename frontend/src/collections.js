export const savedKey = (id) => 'smartfit-saved-looks:' + encodeURIComponent(id || 'guest');
export function cleanSavedLooks(value) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id))
        ),
      ].slice(0, 200)
    : [];
}
export function readSavedLooks(id) {
  try {
    return cleanSavedLooks(JSON.parse(globalThis.localStorage?.getItem(savedKey(id)) || '[]'));
  } catch {
    return [];
  }
}
export function writeSavedLooks(id, looks) {
  try {
    globalThis.localStorage?.setItem(savedKey(id), JSON.stringify(cleanSavedLooks(looks)));
  } catch {}
}
