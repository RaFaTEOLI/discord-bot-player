import { DiscordClient } from '@/domain/models/discord-client';
import { PlayMusic } from '@/domain/usecases/play-music';
import { Song } from 'discord-music-player';
import { Message } from 'discord.js';
import { mockDiscordClient } from './mock-discord-client';
import { mockDiscordMessage } from './mock-discord-message';

export const mockDiscordPlayMusic = (): PlayMusic => {
  class DiscordPlayMusicStub implements PlayMusic {
    constructor(private readonly client: DiscordClient, private readonly message: Message) {}

    async play(url: string): Promise<Song> {
      return await Promise.resolve(null);
    }
  }
  return new DiscordPlayMusicStub(mockDiscordClient(), mockDiscordMessage());
};
