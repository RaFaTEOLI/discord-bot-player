import { SendMessage, SendMessageParams } from '@/domain/usecases/send-message';
import { EmbedBuilder } from 'discord.js';
import { SendMessageChannel } from '../protocols/discord/send-message-channel';
import { mockEmbedBuilder } from './mock-embed-builder';
import { mockSendMessageChannel } from './mock-send-message-channel';

export const mockDiscordSendMessage = (): SendMessage => {
  class DiscordSendMessageStub implements SendMessage {
    constructor(
      private readonly sendMessageChannel: SendMessageChannel,
      private readonly embedBuilder: EmbedBuilder
    ) {}

    async send(message: SendMessageParams): Promise<void> {}
  }
  return new DiscordSendMessageStub(mockSendMessageChannel(), mockEmbedBuilder());
};
