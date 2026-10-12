/** Extracts a user-facing message from a $fetch / useFetch error. */
export function getErrorMessage(error: unknown, fallback = 'Произошла ошибка'): string {
  if (error && typeof error === 'object') {
    const data = (error as { data?: { statusMessage?: string; message?: string } }).data
    if (data?.message) return data.message
    if (data?.statusMessage) return data.statusMessage
  }
  return fallback
}
