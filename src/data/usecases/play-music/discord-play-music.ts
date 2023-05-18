import { Message } from 'discord.js';
import 'dotenv/config';
import { PlayMusic } from '@/domain/usecases/play-music';
import { Playlist, Queue, Song } from 'discord-music-player';

export class DiscordPlayMusic implements PlayMusic {
  constructor(private readonly discordQueue: Queue, private readonly message: Message) {}

  async play(url: string, playlist?: boolean): Promise<Song | Playlist> {
    if (this.message.member.voice.channel) {
      await this.discordQueue.join(this.message.member.voice.channel);
    } else {
      // Auto assign a channel for the bot to join
      const voiceChannels = this.message.guild.channels.cache
        .filter(channel => channel.type === 2 && Array.from(channel.members).length > 0)
        .map(channel => channel.id);

      if (voiceChannels.length) {
        await this.discordQueue.join(voiceChannels[0]);
      }
    }
    if (playlist) {
      return await this.discordQueue.playlist(url);
    }
    return await this.discordQueue.play(url);
  }
}
