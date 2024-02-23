import { DiscordExecuteCommand } from '@/data/usecases/execute-command/discord-execute-command';
import { DiscordClient } from '@/domain/models/discord-client';
import { ChatInputCommandInteraction, Message } from 'discord.js';
import { makeRemoteLoadCommandFactory } from '@/main/factories/usecases/remote/remote-load-command-factory';
import { makeRemoteLoadCommandsFactory } from '@/main/factories/usecases/remote/remote-load-commands-factory';
import { makeDiscordCreateQueueFactory } from './discord-create-queue-factory';
import { makeDiscordPlayMusicFactory } from './discord-play-music-factory';
import { makeDiscordSendMessageFactory } from './discord-send-message-factory';
import { PlayerModel } from '@/domain/models/player';

export const makeDiscordExecuteCommandFactory = (
  client: DiscordClient,
  message: Message | ChatInputCommandInteraction,
  playerSettings: PlayerModel
): DiscordExecuteCommand => {
  const remoteLoadCommand = makeRemoteLoadCommandFactory();
  const discordQueue = makeDiscordCreateQueueFactory(client, message);
  const discordPlayMusic = makeDiscordPlayMusicFactory(discordQueue, message);
  const discordSendMessage = makeDiscordSendMessageFactory(message.channel);
  const remoteLoadCommands = makeRemoteLoadCommandsFactory();

  const executeCommand = new DiscordExecuteCommand(
    remoteLoadCommand,
    discordSendMessage,
    discordPlayMusic,
    playerSettings,
    remoteLoadCommands
  );
  return executeCommand;
};
