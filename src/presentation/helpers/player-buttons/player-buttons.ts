import { ButtonStyle } from 'discord.js';

export const playerButtons = [
  {
    label: 'Stop',
    customId: 'stop',
    style: ButtonStyle.Secondary,
    emoji: '⏹️'
  },
  {
    label: 'Pause',
    customId: 'pause',
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
