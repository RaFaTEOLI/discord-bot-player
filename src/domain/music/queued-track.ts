export interface QueuedTrack {
  id: string;
  name: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  durationMs?: number;
  /** Direct YouTube watch URL when already known */
  youtubeUrl?: string;
  /** When set, first YouTube search hit is used at play time */
  youtubeSearchQuery?: string;
}
