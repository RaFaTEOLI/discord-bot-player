import { APIEmbedField, ButtonStyle, Message, MessageCreateOptions } from 'discord.js';

export type SendMessageParams = {
  title: string;
  description?: string;
  fields?: APIEmbedField | APIEmbedField[];
  buttons?: [{ label: string; customId: string; style: ButtonStyle }];
};

export type SendMessageEmbedParams = string | Message | MessageCreateOptions;

export interface SendMessage {
  send: (message: SendMessageParams) => Promise<void>;
}
