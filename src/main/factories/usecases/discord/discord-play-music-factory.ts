import { DiscordPlayMusic } from '@/data/usecases/play-music/discord-play-music';
import { Queue } from 'discord-music-player';
import { Message } from 'discord.js';

export const makeDiscordPlayMusicFactory = (queue: Queue, message: Message): DiscordPlayMusic => {
  return new DiscordPlayMusic(queue, message);
};
