import type { MusicPlayerFacade } from '@/domain/music/guild-music-queue';
import { Client } from 'discord.js';

export interface DiscordClient extends Client {
  music: MusicPlayerFacade;
}
