import { DiscordCreateQueue } from '@/data/usecases/create-queue/discord-create-queue';
import { DiscordClient } from '@/domain/models/discord-client';
import { Queue } from '@rafateoli/discord-music-player';
import { ChatInputCommandInteraction, Message } from 'discord.js';

export const makeDiscordCreateQueueFactory = (
  client: DiscordClient,
  message: Message | ChatInputCommandInteraction
): Queue => {
  return new DiscordCreateQueue(client, message).createQueue();
};
