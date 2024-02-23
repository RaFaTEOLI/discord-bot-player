import { ChatInputCommandInteraction, Message } from 'discord.js';
import 'dotenv/config';
import { PlayMusic } from '@/domain/usecases/play-music';
import { Playlist, Queue, Song } from '@rafateoli/discord-music-player';

export class DiscordPlayMusic implements PlayMusic {
  constructor(
    private readonly discordQueue: Queue,
    private readonly message: Message | ChatInputCommandInteraction
  ) {}

  async play(url: string, playlist?: boolean): Promise<Song | Playlist> {
    if (this.message.member && 'voice' in this.message.member && this.message.member.voice.channel) {
      await this.discordQueue.join(this.message.member.voice.channel);
    } else if (this.message instanceof ChatInputCommandInteraction) {
      const userId = this.message.user.id;
      const voiceChannel = this.message.guild.channels.cache.find(
        channel => channel.type === 2 && channel.members.has(userId)
      );

      await this.discordQueue.join(voiceChannel.id);
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
