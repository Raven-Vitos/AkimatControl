/** Departments, users and the current user; shared across pages via the useFetch key. */
export function useMeta() {
  return useFetch('/api/meta', { key: 'meta', dedupe: 'defer' })
}
