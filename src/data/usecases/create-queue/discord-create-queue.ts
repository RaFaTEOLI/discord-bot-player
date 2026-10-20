import { ChatInputCommandInteraction, Message } from 'discord.js';
import 'dotenv/config';
import type { IGuildMusicQueue } from '@/domain/music/guild-music-queue';
import { DiscordClient } from '@/domain/models/discord-client';
import { CreateQueue } from '@/domain/usecases/create-queue';

export class DiscordCreateQueue implements CreateQueue {
  constructor(
    private readonly client: DiscordClient,
    private readonly message: Message | ChatInputCommandInteraction
  ) {}

  createQueue(guildId: string): IGuildMusicQueue {
    return this.client.music.createQueue(guildId);
  }
}
