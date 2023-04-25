import {
  ButtonBuilder,
  EmbedBuilder,
  GuildTextBasedChannel,
  If,
  TextBasedChannel,
  ActionRowBuilder
} from 'discord.js';
import { SendMessageChannel } from '@/data/protocols/discord/send-message-channel';
import { DiscordSendMessage } from '@/data/usecases/send-message/discord-send-message';

export const makeDiscordSendMessageFactory = (
  channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>
): DiscordSendMessage => {
  const sendMessage = new DiscordSendMessage(
    channel as SendMessageChannel,
    new EmbedBuilder(),
    () => new ButtonBuilder(),
    new ActionRowBuilder<ButtonBuilder>()
  );
  return sendMessage;
};
