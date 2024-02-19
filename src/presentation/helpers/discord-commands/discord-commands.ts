import { ButtonInteraction, ChatInputCommandInteraction, Message } from 'discord.js';

export const getCommand = (
  message: Message | ButtonInteraction | ChatInputCommandInteraction
): { args: string; command: string } => {
  const prefix = process.env.BOT_PREFIX;

  let args = [];
  let command = '';

  if (message instanceof Message) {
    args = message.content.slice(prefix.length).trim().split(/ +/g);
  }

  if (message instanceof Message) {
    command = args.shift();
  }

  return { command, args: args.join(' ') };
};
