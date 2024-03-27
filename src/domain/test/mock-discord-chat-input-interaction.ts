import { ChatInputCommandInteraction, UserFlagsBitField } from 'discord.js';
import { mockDiscordClient } from './mock-discord-client';
import { mockDiscordAPIMessage } from './mock-discord-api-message';

export const mockDiscordChatInputInteraction = (): ChatInputCommandInteraction => {
  const apiMessage = mockDiscordAPIMessage() as any;
  apiMessage.id = '1209202836768952360';
  apiMessage.data = {
    id: '1205239436145729638'
  };
  apiMessage.user = {
    id: '338074945462730772',
    bot: false,
    system: false,
    flags: [UserFlagsBitField],
    username: 'rafateoli',
    globalName: 'RaFaTEOLI',
    discriminator: '0',
    avatar: '700c8af8b4191094a925a0ae83a01350',
    banner: undefined,
    accentColor: undefined,
    avatarDecoration: null
  } as any;
  // @ts-expect-error
  const chatInputInteraction = new ChatInputCommandInteraction(mockDiscordClient(), apiMessage);
  return chatInputInteraction;
};
