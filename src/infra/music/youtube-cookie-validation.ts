/**
 * Heuristic checks for the raw cookie string passed to youtubei.js `Innertube.create({ cookie })`.
 * Does not guarantee YouTube will accept the session — use `yarn validate:youtube-cookie` for a live probe.
 */
export type YoutubeCookieFormatResult =
  | { ok: true }
  | { ok: false; reason: string };

export const validateYoutubeCookieFormat = (raw: string): YoutubeCookieFormatResult => {
  const cookie = raw.trim();
  if (!cookie) {
    return { ok: false, reason: 'YOUTUBE_COOKIE is empty or whitespace.' };
  }
  if (cookie.length < 40) {
    return { ok: false, reason: 'YOUTUBE_COOKIE is too short to be a useful browser cookie string.' };
  }
  if (!cookie.includes('=')) {
    return { ok: false, reason: 'YOUTUBE_COOKIE should look like "name=value; name2=value2" (at least one =).' };
  }
  const looksLikeHeaderPair = /[^=;\s]+=[^;]+/.test(cookie);
  if (!looksLikeHeaderPair) {
    return { ok: false, reason: 'YOUTUBE_COOKIE does not match expected cookie header pairs.' };
  }
  return { ok: true };
};
