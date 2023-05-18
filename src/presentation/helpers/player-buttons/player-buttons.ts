import { ButtonStyle } from 'discord.js';

export const playerButtons = [
  {
    label: 'Shuffle',
    customId: 'shuffle',
    style: ButtonStyle.Secondary,
    emoji: '🔀'
  },
  {
    label: 'Stop',
    customId: 'stop',
    style: ButtonStyle.Secondary,
    emoji: '⏹️'
  },
  {
    label: 'Pause/Play',
    customId: 'togglePlay',
    style: ButtonStyle.Secondary,
    emoji: '⏯️'
  },
  {
    label: 'Skip',
    customId: 'skip',
    style: ButtonStyle.Secondary,
    emoji: '⏭️'
  }
];
