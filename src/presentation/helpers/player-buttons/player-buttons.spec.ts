import { ButtonStyle } from 'discord.js';
import { playerButtons } from './player-buttons';

describe('PlayerButtons', () => {
  test('should have stop emoji on Stop action', () => {
    expect(playerButtons[0].customId).toBe('stop');
    expect(playerButtons[0].emoji).toBe('⏹️');
    expect(playerButtons[0].label).toBe('Stop');
    expect(playerButtons[0].style).toBe(ButtonStyle.Secondary);
  });

  test('should have pause emoji on Pause action', () => {
    expect(playerButtons[1].customId).toBe('pause');
    expect(playerButtons[1].emoji).toBe('⏯️');
    expect(playerButtons[1].label).toBe('Pause');
    expect(playerButtons[1].style).toBe(ButtonStyle.Secondary);
  });

  test('should have next emoji on Skip action', () => {
    expect(playerButtons[2].customId).toBe('skip');
    expect(playerButtons[2].emoji).toBe('⏭️');
    expect(playerButtons[2].label).toBe('Skip');
    expect(playerButtons[2].style).toBe(ButtonStyle.Secondary);
  });
});
