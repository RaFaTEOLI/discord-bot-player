import { DiscordClient } from '@/domain/models/discord-client';
import { Player, Queue } from 'discord-music-player';
import { mockDiscordQueue } from './mock-discord-queue';

export const mockDiscordClient = (): DiscordClient => {
  class DiscordPlayer {
    createQueue(guildId: string): Queue {
      return mockDiscordQueue();
    }
  }
  class ClientStub {
    player: Player;
    constructor() {
      this.player = new DiscordPlayer() as Player;
    }
  }
  return new ClientStub() as DiscordClient;
};
