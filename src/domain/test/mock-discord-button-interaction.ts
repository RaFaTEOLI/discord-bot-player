import { ButtonInteraction, InteractionType } from 'discord.js';
import { mockDiscordClient } from './mock-discord-client';
import { mockDiscordAPIMessage } from './mock-discord-api-message';

export const mockDiscordButtonInteraction = (): ButtonInteraction => {
  const apiMessage = mockDiscordAPIMessage() as any;
  const innerApiMessage = mockDiscordAPIMessage() as any;
  apiMessage.user = apiMessage.author;
  apiMessage.channel_id = '1234567890';
  apiMessage.custom_id = '1234567890';
  apiMessage.data = {
    custom_id: '1234567890'
  };
  apiMessage.message = innerApiMessage;
  Object.assign(apiMessage, {
    type: InteractionType.MessageComponent,
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
    }
  });
  // @ts-expect-error
  return new ButtonInteraction(mockDiscordClient(), apiMessage);
};
