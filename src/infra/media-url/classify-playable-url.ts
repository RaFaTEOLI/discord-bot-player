export type SpotifyResourceKind = 'track' | 'playlist' | 'album';

export type PlayableUrl =
  | { kind: 'youtube-video'; videoId: string }
  | { kind: 'youtube-playlist'; playlistId: string }
  | { kind: 'spotify'; resource: SpotifyResourceKind; id: string }
  | { kind: 'unsupported' }
  | { kind: 'search'; query: string };

const YOUTUBE_VIDEO_ID = /^[\w-]{11}$/;
const YOUTUBE_PATH_VIDEO = /^\/(?:shorts|live|embed|v)\/([\w-]{11})(?:[/?#]|$)/;
const SPOTIFY_PATH = /^\/(?:intl-[a-z]{2}\/)?(track|playlist|album)\/([a-zA-Z0-9]+)/;

const hostMatches = (host: string, domain: string): boolean => host === domain || host.endsWith(`.${domain}`);

const parseUrl = (input: string): URL | null => {
  if (/^https?:\/\//i.test(input)) {
    try {
      return new URL(input);
    } catch {
      return null;
    }
  }
  // Bare links such as "youtu.be/abc" or "open.spotify.com/track/x" (no spaces, host-looking prefix).
  if (/^[\w-]+(\.[\w-]+)+\/\S*$/.test(input)) {
    try {
      return new URL(`https://${input}`);
    } catch {
      return null;
    }
  }
  return null;
};

const youtubeVideoIdFromUrl = (u: URL): string | null => {
  const host = u.hostname.toLowerCase();
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    return YOUTUBE_VIDEO_ID.test(id) ? id : null;
  }
  if (!hostMatches(host, 'youtube.com')) return null;
  const v = u.searchParams.get('v');
  if (u.pathname === '/watch' && v && YOUTUBE_VIDEO_ID.test(v)) return v;
  return u.pathname.match(YOUTUBE_PATH_VIDEO)?.[1] ?? null;
};

/** Video id from any YouTube watch / short / youtu.be URL, or a bare 11-char id. */
export const extractYoutubeVideoId = (input: string): string | null => {
  const trimmed = input.trim();
  if (YOUTUBE_VIDEO_ID.test(trimmed)) return trimmed;
  const u = parseUrl(trimmed);
  return u ? youtubeVideoIdFromUrl(u) : null;
};

export const classifyPlayableUrl = (input: string): PlayableUrl => {
  const trimmed = input.trim();
  const u = parseUrl(trimmed);
  if (!u) {
    // A malformed link is not a useful search query.
    return /^https?:\/\//i.test(trimmed) ? { kind: 'unsupported' } : { kind: 'search', query: trimmed };
  }
  const host = u.hostname.toLowerCase();

  if (host === 'youtu.be' || hostMatches(host, 'youtube.com')) {
    const list = u.searchParams.get('list');
    if (u.pathname === '/playlist' && list) {
      return { kind: 'youtube-playlist', playlistId: list };
    }
    const videoId = youtubeVideoIdFromUrl(u);
    return videoId ? { kind: 'youtube-video', videoId } : { kind: 'unsupported' };
  }

  if (hostMatches(host, 'spotify.com')) {
    const m = u.pathname.match(SPOTIFY_PATH);
    return m ? { kind: 'spotify', resource: m[1] as SpotifyResourceKind, id: m[2] } : { kind: 'unsupported' };
  }

  // SoundCloud, Deezer and any other site.
  return { kind: 'unsupported' };
};
