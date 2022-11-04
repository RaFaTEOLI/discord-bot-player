import { Queue } from 'discord-music-player';

export interface CreateQueue {
  createQueue: (guildId: string) => Queue;
}
