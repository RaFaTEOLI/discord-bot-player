import { Message } from 'discord.js';
import { mockDiscordAPIMessage } from './mock-discord-api-message';
import { mockDiscordClient } from './mock-discord-client';

export const mockDiscordMessage = (): Message => {
  // @ts-expect-error
  const message = new Message(mockDiscordClient(), mockDiscordAPIMessage());
  return message;
};
