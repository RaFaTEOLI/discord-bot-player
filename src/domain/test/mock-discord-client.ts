import { Client, GatewayIntentBits } from 'discord.js';

export const mockDiscordClient = (): Client => {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers
    ]
  });
};
