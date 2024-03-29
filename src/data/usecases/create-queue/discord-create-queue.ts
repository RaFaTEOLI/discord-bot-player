import { ChatInputCommandInteraction, Message } from 'discord.js';
import 'dotenv/config';
import { Queue } from '@rafateoli/discord-music-player';
import { DiscordClient } from '@/domain/models/discord-client';
import { CreateQueue } from '@/domain/usecases/create-queue';

export class DiscordCreateQueue implements CreateQueue {
  constructor(
    private readonly client: DiscordClient,
    private readonly message: Message | ChatInputCommandInteraction
  ) {}

  createQueue(): Queue {
    return this.client.player.createQueue(this.message.guild.id);
  }
}
