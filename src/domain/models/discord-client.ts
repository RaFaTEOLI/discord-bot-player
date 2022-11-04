import { Player } from 'discord-music-player';
import { Client } from 'discord.js';

export interface DiscordClient extends Client {
  player: Player;
}
