import { PlayMusic } from '@/domain/usecases/play-music';
import { Song } from 'discord-music-player';
import { Client, EmbedBuilder } from 'discord.js';
import { SendMessageChannel } from '../protocols/discord/send-message-channel';
import { mockClient } from './mock-client';
import { mockEmbedBuilder } from './mock-embed-builder';
import { mockSendMessageChannel } from './mock-send-message-channel';

export const mockDiscordPlayMusic = (): PlayMusic => {
  class DiscordPlayMusicStub implements PlayMusic {
    constructor(
      private readonly client: Client,
      private readonly sendMessageChannel: SendMessageChannel,
      private readonly embedBuilder: EmbedBuilder
    ) {}

    async play(url: string): Promise<Song> {
      return await Promise.resolve(null);
    }
  }
  return new DiscordPlayMusicStub(mockClient(), mockSendMessageChannel(), mockEmbedBuilder());
};
