import type { QueuedTrack } from '@/domain/music/queued-track';
import { searchFirstYoutubeVideo, youtubeWatchUrl } from './youtube-search';

export const resolveYoutubeUrlForTrack = async (track: QueuedTrack): Promise<string> => {
  if (track.youtubeUrl) {
    return track.youtubeUrl;
  }
  if (!track.youtubeSearchQuery) {
    throw new Error('VideoUnavailable');
  }
  const v = await searchFirstYoutubeVideo(track.youtubeSearchQuery);
  return youtubeWatchUrl(v.id);
};
