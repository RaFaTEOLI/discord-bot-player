import { Message } from 'discord.js';
import 'dotenv/config';
import { PlayMusic } from '@/domain/usecases/play-music';
import { Queue, Song } from 'discord-music-player';

export class DiscordPlayMusic implements PlayMusic {
  constructor(private readonly discordQueue: Queue, private readonly message: Message) {}

  async play(url: string): Promise<Song> {
    try {
      await this.discordQueue.join(this.message.member.voice.channel);
      return null;
    } catch (error) {
      throw new Error('Error while playing music message');
    }
  }
}
