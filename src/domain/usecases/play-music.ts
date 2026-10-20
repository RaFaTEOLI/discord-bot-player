import type { PlayMusicResult } from '@/domain/music/guild-music-queue';

export type { PlayMusicResult };

export interface PlayMusic {
  play: (url: string, playlist?: boolean) => Promise<PlayMusicResult>;
}
