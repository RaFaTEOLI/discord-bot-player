import { ChannelType, ChatInputCommandInteraction, Message } from 'discord.js';
import 'dotenv/config';
import type { IGuildMusicQueue } from '@/domain/music/guild-music-queue';
import type { PlayMusicResult } from '@/domain/usecases/play-music';
import { PlayMusic } from '@/domain/usecases/play-music';

export class DiscordPlayMusic implements PlayMusic {
  constructor(
    private readonly discordQueue: IGuildMusicQueue,
    private readonly message: Message | ChatInputCommandInteraction
  ) {}

  async play(url: string, playlist?: boolean): Promise<PlayMusicResult> {
    if (this.message.member && 'voice' in this.message.member && this.message.member.voice.channel) {
      await this.discordQueue.join(this.message.member.voice.channel);
    } else if (this.message instanceof ChatInputCommandInteraction) {
      const userId = this.message.user.id;
      const voiceChannel = this.message.guild.channels.cache.find(
        channel => channel.type === ChannelType.GuildVoice && channel.members.has(userId)
      );

      if (voiceChannel) {
        await this.discordQueue.join(voiceChannel.id);
      }
    } else {
      const voiceChannels = this.message.guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildVoice && Array.from(channel.members).length > 0)
        .map(channel => channel.id);

      if (voiceChannels.length) {
        await this.discordQueue.join(voiceChannels[0]);
      }
    }
    return await this.discordQueue.enqueue(url, { forcePlaylist: Boolean(playlist) });
  }
}
