import { APIEmbedField, APIMessageComponentEmoji, ButtonStyle, Message, MessageCreateOptions } from 'discord.js';

export type SendMessageParams = {
  title: string;
  description?: string;
  fields?: APIEmbedField | APIEmbedField[];
  buttons?: Array<{ label: string; customId: string; style: ButtonStyle, emoji?: string | APIMessageComponentEmoji }>;
};

export type SendMessageEmbedParams = string | Message | MessageCreateOptions;

export interface SendMessage {
  send: (message: SendMessageParams) => Promise<void>;
}
