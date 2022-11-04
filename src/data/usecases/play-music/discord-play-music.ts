import { Message } from 'discord.js';
import 'dotenv/config';
import { PlayMusic } from '@/domain/usecases/play-music';
import { Song } from 'discord-music-player';
import { DiscordClient } from '@/domain/models/discord-client';

export class DiscordPlayMusic implements PlayMusic {
  constructor(private readonly client: DiscordClient, private readonly message: Message) {}

  async play(url: string): Promise<Song> {
    try {
      this.client.player.createQueue(this.message.guild.id);
      return null;
    } catch (error) {
      console.log(error);
      throw new Error('Error while playing music message');
    }
  }
}
