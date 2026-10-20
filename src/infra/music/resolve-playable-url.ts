import { randomUUID } from 'node:crypto';
import play from 'play-dl';
import type { QueuedTrack } from '@/domain/music/queued-track';
import { spotifyApiGet, spotifyAuthorizedGet } from './spotify-web-api';

export const SPOTIFY_NOT_CONFIGURED = 'SpotifyNotConfigured';

export type SpotifyCredentials = { clientId: string; clientSecret: string };

type SpotifyTrackApi = {
  name: string;
  artists: Array<{ name: string }>;
  external_urls?: { spotify: string };
  album?: { images?: Array<{ url: string }> };
  duration_ms: number;
};

const parseSpotifyUrl = (url: string): { kind: 'track' | 'playlist' | 'album'; id: string } | null => {
  const u = url.trim();
  const track = u.match(/spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/)?.[1];
  if (track) return { kind: 'track', id: track };
  const playlist = u.match(/spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([a-zA-Z0-9]+)/)?.[1];
  if (playlist) return { kind: 'playlist', id: playlist };
  const album = u.match(/spotify\.com\/(?:intl-[a-z]{2}\/)?album\/([a-zA-Z0-9]+)/)?.[1];
  if (album) return { kind: 'album', id: album };
  return null;
};

const spotifyTrackToQueued = (t: SpotifyTrackApi): QueuedTrack => {
  const author = t.artists.map(a => a.name).join(', ') || 'Unknown';
  const thumb = t.album?.images?.[0]?.url ?? '';
  const query = `${author} — ${t.name}`.replace(/\s+/g, ' ').trim();
  return {
    id: randomUUID(),
    name: t.name,
    author,
    url: t.external_urls?.spotify ?? '',
    thumbnail: thumb,
    duration: msToLabel(t.duration_ms),
    durationMs: t.duration_ms,
    youtubeSearchQuery: query
  };
};

const msToLabel = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const youtubeVideoToTrack = (v: {
  url: string;
  title?: string;
  durationRaw: string;
  durationInSec: number;
  thumbnails: Array<{ url: string }>;
  channel?: { name?: string };
}): QueuedTrack => {
  const thumb = v.thumbnails[0]?.url ?? '';
  return {
    id: randomUUID(),
    name: v.title ?? 'Unknown',
    author: v.channel?.name ?? 'Unknown',
    url: v.url,
    thumbnail: thumb,
    duration: v.durationRaw,
    durationMs: v.durationInSec * 1000,
    youtubeUrl: v.url
  };
};

const fetchSpotifyTrack = async (id: string, creds: SpotifyCredentials): Promise<QueuedTrack[]> => {
  const t = await spotifyApiGet<SpotifyTrackApi>(`/tracks/${id}`, creds.clientId, creds.clientSecret);
  return [spotifyTrackToQueued(t)];
};

const fetchSpotifyPlaylist = async (
  id: string,
  creds: SpotifyCredentials
): Promise<{ tracks: QueuedTrack[]; playlistName: string }> => {
  const meta = await spotifyApiGet<{ name: string }>(
    `/playlists/${id}?fields=name`,
    creds.clientId,
    creds.clientSecret
  );
  const tracks: QueuedTrack[] = [];
  let next: string | null = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100`;
  while (next) {
    const page = await spotifyAuthorizedGet<{
      items: Array<{ track: SpotifyTrackApi | null }>;
      next: string | null;
    }>(next, creds.clientId, creds.clientSecret);
    for (const row of page.items) {
      if (row.track) tracks.push(spotifyTrackToQueued(row.track));
    }
    next = page.next;
  }
  return { tracks, playlistName: meta.name };
};

type SpotifyAlbumTrackItem = {
  name: string;
  artists: Array<{ name: string }>;
  external_urls: { spotify: string };
  duration_ms: number;
};

const fetchSpotifyAlbum = async (
  id: string,
  creds: SpotifyCredentials
): Promise<{ tracks: QueuedTrack[]; playlistName: string }> => {
  const meta = await spotifyApiGet<{ name: string; images?: Array<{ url: string }> }>(
    `/albums/${id}?fields=name,images`,
    creds.clientId,
    creds.clientSecret
  );
  const thumb = meta.images?.[0]?.url ?? '';
  const tracks: QueuedTrack[] = [];
  let next: string | null = `https://api.spotify.com/v1/albums/${id}/tracks?limit=50`;
  while (next) {
    const page = await spotifyAuthorizedGet<{
      items: SpotifyAlbumTrackItem[];
      next: string | null;
    }>(next, creds.clientId, creds.clientSecret);
    for (const t of page.items) {
      const author = t.artists.map(a => a.name).join(', ') || 'Unknown';
      const query = `${author} — ${t.name}`.replace(/\s+/g, ' ').trim();
      tracks.push({
        id: randomUUID(),
        name: t.name,
        author,
        url: t.external_urls.spotify,
        thumbnail: thumb,
        duration: msToLabel(t.duration_ms),
        durationMs: t.duration_ms,
        youtubeSearchQuery: query
      });
    }
    next = page.next;
  }
  return { tracks, playlistName: meta.name };
};

const resolveSpotify = async (
  url: string,
  creds: SpotifyCredentials | null
): Promise<{ tracks: QueuedTrack[]; playlistName?: string }> => {
  if (!creds?.clientId || !creds.clientSecret) {
    throw new Error(SPOTIFY_NOT_CONFIGURED);
  }
  const parsed = parseSpotifyUrl(url);
  if (!parsed) {
    throw new Error('InvalidSpotify');
  }
  if (parsed.kind === 'track') {
    return { tracks: await fetchSpotifyTrack(parsed.id, creds) };
  }
  if (parsed.kind === 'playlist') {
    return await fetchSpotifyPlaylist(parsed.id, creds);
  }
  return await fetchSpotifyAlbum(parsed.id, creds);
};

export const resolvePlayableUrl = async (
  url: string,
  options: { forcePlaylist?: boolean; spotify?: SpotifyCredentials | null }
): Promise<{ tracks: QueuedTrack[]; playlistName?: string }> => {
  void options.forcePlaylist;
  const trimmed = url.trim();
  const validation = await play.validate(trimmed);

  const unsupported = (): Error => new Error('UnsupportedSource');

  if (
    validation === 'so_playlist' ||
    validation === 'so_track' ||
    (typeof validation === 'string' && validation.startsWith('dz_'))
  ) {
    throw unsupported();
  }

  if (validation === 'sp_track' || validation === 'sp_playlist' || validation === 'sp_album') {
    return await resolveSpotify(trimmed, options.spotify ?? null);
  }

  if (validation === 'yt_video') {
    const info = await play.video_basic_info(trimmed);
    const v = info.video_details;
    if (v.live) {
      throw new Error('LiveUnsupported');
    }
    return { tracks: [youtubeVideoToTrack(v)] };
  }

  if (validation === 'yt_playlist') {
    const pl = await play.playlist_info(trimmed, { incomplete: true });
    await pl.fetch();
    const videos = await pl.all_videos();
    const tracks = videos.filter(v => !v.live).map(v => youtubeVideoToTrack(v));
    return { tracks, playlistName: pl.title ?? 'YouTube playlist' };
  }

  if (validation === 'search' || validation === false) {
    const videos = await play.search(trimmed, { limit: 1, source: { youtube: 'video' } });
    if (!videos.length) {
      throw new Error('SearchIsNull');
    }
    return { tracks: [youtubeVideoToTrack(videos[0])] };
  }

  throw unsupported();
};
