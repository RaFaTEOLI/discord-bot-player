import { randomUUID } from 'node:crypto';
import type { QueuedTrack } from '@/domain/music/queued-track';
import { getYoutubeClient } from './youtube-client';

export type YoutubeVideoSummary = {
  id: string;
  title: string;
  author: string;
  durationSec: number;
  isLive: boolean;
};

/** Loose shape covering the `Video`, `PlaylistVideo` and `LockupView` nodes youtubei.js returns. */
type VideoLikeNode = {
  type: string;
  video_id?: string;
  id?: string;
  content_id?: string;
  content_type?: string;
  title?: { toString: () => string };
  metadata?: { title?: { toString: () => string } } | null;
  author?: { name?: string };
  duration?: { seconds?: number };
  is_live?: boolean;
  is_upcoming?: boolean;
  is_playable?: boolean;
};

export const youtubeWatchUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

const secondsToLabel = (total: number): string => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

/** Normalizes a search/playlist node into a summary; returns null for non-video or unplayable nodes. */
export const toYoutubeVideoSummary = (node: VideoLikeNode): YoutubeVideoSummary | null => {
  let id: string | undefined;
  let title: string | undefined;
  if (node.type === 'Video') {
    id = node.video_id;
    title = node.title?.toString();
  } else if (node.type === 'PlaylistVideo') {
    if (!(node.is_playable ?? true)) return null;
    id = node.id;
    title = node.title?.toString();
  } else if (node.type === 'LockupView' && node.content_type === 'VIDEO') {
    id = node.content_id;
    title = node.metadata?.title?.toString();
  }
  if (!id) return null;
  return {
    id,
    title: title || 'Unknown',
    author: node.author?.name || 'Unknown',
    durationSec: node.duration?.seconds ?? 0,
    isLive: Boolean(node.is_live) || Boolean(node.is_upcoming)
  };
};

export const youtubeSummaryToTrack = (v: YoutubeVideoSummary): QueuedTrack => {
  const url = youtubeWatchUrl(v.id);
  return {
    id: randomUUID(),
    name: v.title,
    author: v.author,
    url,
    thumbnail: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    duration: secondsToLabel(v.durationSec),
    durationMs: v.durationSec * 1000,
    youtubeUrl: url
  };
};

/** First non-live video for a free-text query; throws `SearchIsNull` when nothing matches. */
export const searchFirstYoutubeVideo = async (query: string): Promise<YoutubeVideoSummary> => {
  const yt = await getYoutubeClient();
  const search = await yt.search(query, { type: 'video' });
  for (const node of search.results as unknown as VideoLikeNode[]) {
    const v = toYoutubeVideoSummary(node);
    if (v && !v.isLive) return v;
  }
  throw new Error('SearchIsNull');
};
