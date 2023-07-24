import { Queue } from '@rafateoli/discord-music-player';

export interface CreateQueue {
  createQueue: (guildId: string) => Queue;
}
