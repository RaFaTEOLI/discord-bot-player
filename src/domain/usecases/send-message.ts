import { APIEmbedField, Message, MessageCreateOptions } from 'discord.js';

export type SendMessageParams = {
  title: string;
  description?: string;
  fields?: APIEmbedField | APIEmbedField[];
};

export type SendMessageEmbedParams = string | Message | MessageCreateOptions;

export interface SendMessage {
  send: (message: SendMessageParams) => Promise<void>;
}
