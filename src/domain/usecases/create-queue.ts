import type { IGuildMusicQueue } from '@/domain/music/guild-music-queue';

export interface CreateQueue {
  createQueue: (guildId: string) => IGuildMusicQueue;
}
