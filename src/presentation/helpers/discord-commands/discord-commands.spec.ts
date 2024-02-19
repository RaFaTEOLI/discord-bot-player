import { describe, expect, test } from 'vitest';
import { getCommand } from './discord-commands';
import { mockDiscordChatInputInteraction, mockDiscordMessage } from '@/domain/test';
import { faker } from '@faker-js/faker';

describe('DiscordCommands', () => {
  describe('Message', () => {
    test('should return a message with args and command', () => {
      const mockMessage = mockDiscordMessage();

      mockMessage.content = `${process.env.BOT_PREFIX}playlist link`;
      const message = getCommand(mockMessage);
      expect(message).toEqual({ args: 'link', command: 'playlist' });
    });
  });

  describe('ChatInputCommandInteraction', () => {
    test('should return a message with args and command', () => {
      const mockMessage = mockDiscordChatInputInteraction();

      const commandName = faker.random.word();
      const commandValue = faker.random.word();

      mockMessage.commandId = '1205239436145729638';
      mockMessage.commandName = commandName;
      mockMessage.options = {
        _hoistedOptions: [
          {
            name: 'link',
            type: 3,
            value: commandValue
          }
        ]
      } as any;
      const message = getCommand(mockMessage);
      expect(message).toEqual({ args: commandValue, command: commandName });
    });
  });
});
