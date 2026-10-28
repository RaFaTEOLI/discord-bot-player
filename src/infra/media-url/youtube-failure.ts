export const YOUTUBE_BLOCKED = 'YoutubeBlocked';
export const VIDEO_UNAVAILABLE = 'VideoUnavailable';

const BLOCKED_PATTERNS = [/not a bot/i, /sign in/i, /login_required/i, /confirm your age/i, /\b403\b/];

/** youtubei.js attaches the failed media `Response` as `err.info.response` on FETCH_FAILED. */
const httpStatusOf = (err: unknown): number | undefined =>
  (err as { info?: { response?: { status?: unknown } } } | null)?.info?.response?.status as number | undefined;

/** Maps a youtubei.js / network failure to a stable error code understood by `discord-errors`. */
export const toYoutubeFailureCode = (err: unknown): typeof YOUTUBE_BLOCKED | typeof VIDEO_UNAVAILABLE => {
  if (httpStatusOf(err) === 403) return YOUTUBE_BLOCKED;
  const message = err instanceof Error ? err.message : String(err);
  return BLOCKED_PATTERNS.some(p => p.test(message)) ? YOUTUBE_BLOCKED : VIDEO_UNAVAILABLE;
};
