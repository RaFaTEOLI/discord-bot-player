import { Message, MessageCreateOptions, MessagePayload } from 'discord.js';
import { mockDiscordMessage } from '@/domain/test';
import { SendMessageChannel } from '@/data/protocols/discord/send-message-channel';

export const mockSendMessageChannel = (): SendMessageChannel => {
  class SendMessageChannelStub implements SendMessageChannel {
    async send(
      options: string | MessagePayload | MessageCreateOptions
    ): Promise<Message<true>> {
      return await Promise.resolve(mockDiscordMessage());
    }
  }
  return new SendMessageChannelStub();
};
