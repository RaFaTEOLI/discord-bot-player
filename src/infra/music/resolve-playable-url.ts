import { randomUUID } from 'node:crypto';
import type { QueuedTrack } from '@/domain/music/queued-track';
import { classifyPlayableUrl, type SpotifyResourceKind } from '@/infra/media-url/classify-playable-url';
import { spotifyApiGet, spotifyAuthorizedGet } from './spotify-web-api';
import { getYoutubeClient } from './youtube-client';
import {
  searchFirstYoutubeVideo,
  toYoutubeVideoSummary,
  youtubeSummaryToTrack,
  type YoutubeVideoSummary
} from './youtube-search';

export const SPOTIFY_NOT_CONFIGURED = 'SpotifyNotConfigured';

export type SpotifyCredentials = { clientId: string; clientSecret: string };

type SpotifyTrackApi = {
  name: string;
  artists: Array<{ name: string }>;
  external_urls?: { spotify: string };
  album?: { images?: Array<{ url: string }> };
  duration_ms: number;
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
  resource: SpotifyResourceKind,
  id: string,
  creds: SpotifyCredentials | null
): Promise<{ tracks: QueuedTrack[]; playlistName?: string }> => {
  if (!creds?.clientId || !creds.clientSecret) {
    throw new Error(SPOTIFY_NOT_CONFIGURED);
  }
  if (resource === 'track') {
    return { tracks: await fetchSpotifyTrack(id, creds) };
  }
  if (resource === 'playlist') {
    return await fetchSpotifyPlaylist(id, creds);
  }
  return await fetchSpotifyAlbum(id, creds);
};

const MAX_PLAYLIST_TRACKS = 500;

const resolveYoutubeVideo = async (videoId: string): Promise<QueuedTrack[]> => {
  const yt = await getYoutubeClient();
  const info = await yt.getBasicInfo(videoId);
  const b = info.basic_info;
  if (b.is_live || b.is_upcoming) {
    throw new Error('LiveUnsupported');
  }
  return [
    youtubeSummaryToTrack({
      id: b.id ?? videoId,
      title: b.title ?? 'Unknown',
      author: b.author ?? b.channel?.name ?? 'Unknown',
      durationSec: b.duration ?? 0,
      isLive: false
    })
  ];
};

const resolveYoutubePlaylist = async (
  playlistId: string
): Promise<{ tracks: QueuedTrack[]; playlistName: string }> => {
  const yt = await getYoutubeClient();
  let page = await yt.getPlaylist(playlistId);
  const playlistName = page.info.title ?? 'YouTube playlist';
  const videos: YoutubeVideoSummary[] = [];
  for (;;) {
    for (const node of page.items) {
      const v = toYoutubeVideoSummary(node as unknown as Parameters<typeof toYoutubeVideoSummary>[0]);
      if (v && !v.isLive) videos.push(v);
    }
    if (videos.length >= MAX_PLAYLIST_TRACKS || !page.has_continuation) break;
    page = await page.getContinuation();
  }
  return { tracks: videos.slice(0, MAX_PLAYLIST_TRACKS).map(youtubeSummaryToTrack), playlistName };
};

export const resolvePlayableUrl = async (
  url: string,
  options: { forcePlaylist?: boolean; spotify?: SpotifyCredentials | null }
): Promise<{ tracks: QueuedTrack[]; playlistName?: string }> => {
  const target = classifyPlayableUrl(url, { preferPlaylist: options.forcePlaylist });
  switch (target.kind) {
    case 'spotify':
      return await resolveSpotify(target.resource, target.id, options.spotify ?? null);
    case 'youtube-video':
      return { tracks: await resolveYoutubeVideo(target.videoId) };
    case 'youtube-playlist':
      return await resolveYoutubePlaylist(target.playlistId);
    case 'search':
      return { tracks: [youtubeSummaryToTrack(await searchFirstYoutubeVideo(target.query))] };
    default:
      throw new Error('UnsupportedSource');
  }
};
