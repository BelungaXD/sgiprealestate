export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return (
      'Network error: the server closed the connection or is unreachable. ' +
      'If you added large photos, wait for uploads to finish; otherwise check that the dev server is running.'
    )
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
