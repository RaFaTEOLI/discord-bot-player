import { Message, MessageCreateOptions, MessagePayload } from 'discord.js';

export interface SendMessageChannel {
  send: (
    options: string | MessagePayload | MessageCreateOptions
  ) => Promise<Message<true | false>>;
}
