import { describe, expect, test } from 'vitest';
import { getCommand } from './discord-commands';
import { mockDiscordMessage } from '@/domain/test';

describe('DiscordCommands', () => {
  test('should return a message with args and command', () => {
    const mockMessage = mockDiscordMessage();

    mockMessage.content = `${process.env.BOT_PREFIX}playlist link`;
    const message = getCommand(mockMessage);
    expect(message).toEqual({ args: 'link', command: 'playlist' });
  });
});
