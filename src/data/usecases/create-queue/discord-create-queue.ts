import { Message } from 'discord.js';
import 'dotenv/config';
import { Queue } from 'discord-music-player';
import { DiscordClient } from '@/domain/models/discord-client';
import { CreateQueue } from '@/domain/usecases/create-queue';

export class DiscordCreateQueue implements CreateQueue {
  constructor(private readonly client: DiscordClient, private readonly message: Message) {}

  createQueue(guildId: string): Queue {
    return this.client.player.createQueue(this.message.guild.id);
  }
}
