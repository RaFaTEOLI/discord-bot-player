import { Client, GatewayIntentBits } from 'discord.js';
import { DiscordClient } from '@/domain/models/discord-client';
import { mockDiscordQueue } from './mock-discord-queue';

class MusicStub {
  createQueue(_guildId: string): ReturnType<typeof mockDiscordQueue> {
    return mockDiscordQueue();
  }

  getQueue(_guildId: string): undefined {
    return undefined;
  }

  on(): this {
    return this;
  }

  off(): this {
    return this;
  }

  emit(): boolean {
    return true;
  }

  setup(): void {}
}

export const mockDiscordClient = (): DiscordClient => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  }) as DiscordClient;
  client.music = new MusicStub() as DiscordClient['music'];
  return client;
};
