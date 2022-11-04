import { Message } from 'discord.js';
import 'dotenv/config';
import { PlayMusic } from '@/domain/usecases/play-music';
import { Queue, Song } from 'discord-music-player';

export class DiscordPlayMusic implements PlayMusic {
  constructor(private readonly discordQueue: Queue, private readonly message: Message) {}

  async play(url: string): Promise<Song> {
    await this.discordQueue.join(this.message.member.voice.channel);
    return await this.discordQueue.play(url);
  }
}
