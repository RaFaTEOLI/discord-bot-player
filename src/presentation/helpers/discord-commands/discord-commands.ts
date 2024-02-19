import { ButtonInteraction, ChatInputCommandInteraction, Message } from 'discord.js';

export const getCommand = (
  message: Message | ButtonInteraction | ChatInputCommandInteraction
): { args: string; command: string } => {
  const prefix = process.env.BOT_PREFIX;

  let args = [];
  let command = '';

  if (message instanceof Message) {
    args = message.content.slice(prefix.length).trim().split(/ +/g);
    command = args.shift();
  }

  if (message instanceof ChatInputCommandInteraction) {
    // @ts-expect-error
    args = message.options._hoistedOptions.map(option => option.value);
    command = message.commandName;
  }

  return { command, args: args.join(' ') };
};
