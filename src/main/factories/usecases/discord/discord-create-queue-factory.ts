import { DiscordCreateQueue } from '@/data/usecases/create-queue/discord-create-queue';
import type { IGuildMusicQueue } from '@/domain/music/guild-music-queue';
import { DiscordClient } from '@/domain/models/discord-client';
import { ChatInputCommandInteraction, Message } from 'discord.js';

export const makeDiscordCreateQueueFactory = (
  client: DiscordClient,
  message: Message | ChatInputCommandInteraction
): IGuildMusicQueue => {
  const guildId = message.guild?.id;
  if (!guildId) {
    throw new Error('GuildMissing');
  }
  return new DiscordCreateQueue(client, message).createQueue(guildId);
};
