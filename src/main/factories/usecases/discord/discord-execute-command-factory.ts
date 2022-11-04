import { DiscordExecuteCommand } from '@/data/usecases/execute-command/discord-execute-command';
import { DiscordClient } from '@/domain/models/discord-client';
import { Message } from 'discord.js';
import { makeRemoteLoadCommandFactory } from '../remote/remote-load-command-factory';
import { makeDiscordCreateQueueFactory } from './discord-create-queue-factory';
import { makeDiscordPlayMusicFactory } from './discord-play-music-factory';
import { makeDiscordSendMessageFactory } from './discord-send-message-factory';

export const makeDiscordExecuteCommandFactory = (
  client: DiscordClient,
  message: Message
): DiscordExecuteCommand => {
  const remoteLoadCommand = makeRemoteLoadCommandFactory();
  const discordQueue = makeDiscordCreateQueueFactory(client, message);
  const discordPlayMusic = makeDiscordPlayMusicFactory(discordQueue, message);
  const discordSendMessage = makeDiscordSendMessageFactory(message.channel);
  const executeCommand = new DiscordExecuteCommand(remoteLoadCommand, discordSendMessage, discordPlayMusic);
  return executeCommand;
};
