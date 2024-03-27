import { ButtonInteraction } from 'discord.js';
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
  // @ts-expect-error
  return new ButtonInteraction(mockDiscordClient(), apiMessage);
};
