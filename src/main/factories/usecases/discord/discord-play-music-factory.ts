import { DiscordPlayMusic } from '@/data/usecases/play-music/discord-play-music';
import type { IGuildMusicQueue } from '@/domain/music/guild-music-queue';
import { ChatInputCommandInteraction, Message } from 'discord.js';

export const makeDiscordPlayMusicFactory = (
  queue: IGuildMusicQueue,
  message: Message | ChatInputCommandInteraction
): DiscordPlayMusic => {
  return new DiscordPlayMusic(queue, message);
};
