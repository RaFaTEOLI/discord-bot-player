import { DiscordCreateQueue } from '@/data/usecases/create-queue/discord-create-queue';
import { DiscordClient } from '@/domain/models/discord-client';
import { Queue } from 'discord-music-player';
import { Message } from 'discord.js';

export const makeDiscordCreateQueueFactory = (client: DiscordClient, message: Message): Queue => {
  return new DiscordCreateQueue(client, message).createQueue();
};
