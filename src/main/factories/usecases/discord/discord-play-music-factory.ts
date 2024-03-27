import { DiscordPlayMusic } from '@/data/usecases/play-music/discord-play-music';
import { Queue } from '@rafateoli/discord-music-player';
import { ChatInputCommandInteraction, Message } from 'discord.js';

export const makeDiscordPlayMusicFactory = (
  queue: Queue,
  message: Message | ChatInputCommandInteraction
): DiscordPlayMusic => {
  return new DiscordPlayMusic(queue, message);
};
