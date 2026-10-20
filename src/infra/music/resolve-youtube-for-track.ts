import play from 'play-dl';
import type { QueuedTrack } from '@/domain/music/queued-track';

export const resolveYoutubeUrlForTrack = async (track: QueuedTrack): Promise<string> => {
  if (track.youtubeUrl) {
    return track.youtubeUrl;
  }
  if (!track.youtubeSearchQuery) {
    throw new Error('VideoUnavailable');
  }
  const results = await play.search(track.youtubeSearchQuery, {
    limit: 1,
    source: { youtube: 'video' }
  });
  if (!results.length) {
    throw new Error('SearchIsNull');
  }
  const v = results[0];
  if (v.live) {
    throw new Error('LiveUnsupported');
  }
  return v.url;
};
