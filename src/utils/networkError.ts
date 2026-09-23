const NETWORK_ERROR_PATTERN =
  /network request failed|failed to fetch|network error|timed? ?out|internet connection appears to be offline/i;

// Supabase surfaces transport failures as plain messages; only these should
// fall back to the offline queue. Server-side rejections (RLS, constraints)
// must still reach the user.
export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return NETWORK_ERROR_PATTERN.test(message);
}
