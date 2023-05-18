import { ButtonStyle } from 'discord.js';
import { playerButtons } from './player-buttons';

describe('PlayerButtons', () => {
  test('should have stop emoji on Shuffle action', () => {
    expect(playerButtons[0].customId).toBe('shuffle');
    expect(playerButtons[0].emoji).toBe('🔀');
    expect(playerButtons[0].label).toBe('Shuffle');
    expect(playerButtons[0].style).toBe(ButtonStyle.Secondary);
  });

  test('should have stop emoji on Stop action', () => {
    expect(playerButtons[1].customId).toBe('stop');
    expect(playerButtons[1].emoji).toBe('⏹️');
    expect(playerButtons[1].label).toBe('Stop');
    expect(playerButtons[1].style).toBe(ButtonStyle.Secondary);
  });

  test('should have pause emoji on Pause action', () => {
    expect(playerButtons[2].customId).toBe('togglePlay');
    expect(playerButtons[2].emoji).toBe('⏯️');
    expect(playerButtons[2].label).toBe('Pause/Play');
    expect(playerButtons[2].style).toBe(ButtonStyle.Secondary);
  });

  test('should have next emoji on Skip action', () => {
    expect(playerButtons[3].customId).toBe('skip');
    expect(playerButtons[3].emoji).toBe('⏭️');
    expect(playerButtons[3].label).toBe('Skip');
    expect(playerButtons[3].style).toBe(ButtonStyle.Secondary);
  });
});
