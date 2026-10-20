import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  InteractionType,
  UserFlagsBitField
} from 'discord.js';
import { mockDiscordClient } from './mock-discord-client';
import { mockDiscordAPIMessage } from './mock-discord-api-message';

export const mockDiscordChatInputInteraction = (): ChatInputCommandInteraction => {
  const apiMessage = mockDiscordAPIMessage() as any;
  apiMessage.id = '1209202836768952360';
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

  Object.assign(apiMessage, {
    type: InteractionType.ApplicationCommand,
    token: 'mock-token',
    application_id: '1205239436145729638',
    version: 1,
    app_permissions: '8',
    locale: 'en-US',
    guild_id: '831310861405834264',
    channel: { id: apiMessage.channel_id },
    entitlements: [],
    member: {
      user: apiMessage.user,
      roles: [],
      joined_at: new Date().toISOString(),
      deaf: false,
      mute: false,
      flags: 0,
      pending: false,
      permissions: '8'
    },
    data: {
      id: '1205239436145729638',
      name: 'play',
      type: ApplicationCommandType.ChatInput,
      options: []
    }
  });

  // @ts-expect-error discord.js expects full API payload; sufficient for unit tests
  const chatInputInteraction = new ChatInputCommandInteraction(mockDiscordClient(), apiMessage);
  return chatInputInteraction;
};
