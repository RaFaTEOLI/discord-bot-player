import { DiscordExecuteCommand } from '@/data/usecases/execute-command/discord-execute-command';
import { BotModel } from '@/domain/models/bot';
import { DiscordClient } from '@/domain/models/discord-client';
import { Message } from 'discord.js';
import { makeRemoteLoadCommandFactory } from '@/main/factories/usecases/remote/remote-load-command-factory';
import { makeRemoteLoadCommandsFactory } from '@/main/factories/usecases/remote/remote-load-commands-factory';
import { makeDiscordCreateQueueFactory } from './discord-create-queue-factory';
import { makeDiscordPlayMusicFactory } from './discord-play-music-factory';
import { makeDiscordSendMessageFactory } from './discord-send-message-factory';

export const makeDiscordExecuteCommandFactory = (
  client: DiscordClient,
  message: Message,
  botSettings: BotModel
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
    botSettings,
    remoteLoadCommands
  );
  return executeCommand;
};
