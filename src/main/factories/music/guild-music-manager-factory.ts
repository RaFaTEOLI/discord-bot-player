import type { Client } from 'discord.js';
import { GuildMusicManager } from '@/infra/music/guild-music-manager';

export const createGuildMusicManager = (client: Client): GuildMusicManager => {
  const clientId = process.env.SPOTIFY_CLIENT_ID ?? '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? '';
  const spotify = clientId && clientSecret ? { clientId, clientSecret } : null;
  const manager = new GuildMusicManager(client, spotify);
  manager.setup(client);
  return manager;
};
