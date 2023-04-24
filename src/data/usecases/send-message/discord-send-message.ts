import { ButtonBuilder, EmbedBuilder, ActionRowBuilder } from 'discord.js';
import 'dotenv/config';
import { SendMessage, SendMessageParams } from '@/domain/usecases/send-message';
import { SendMessageChannel } from '@/data/protocols/discord/send-message-channel';
export class DiscordSendMessage implements SendMessage {
  constructor(
    private readonly sendMessageChannel: SendMessageChannel,
    private readonly embedBuilder: EmbedBuilder,
    private readonly buttonBuilder: ButtonBuilder,
    private readonly actionRowBuilder: ActionRowBuilder<ButtonBuilder>
  ) {}

  async send(message: SendMessageParams): Promise<void> {
    try {
      const embed = this.embedBuilder
        .setColor('#0099ff')
        .setTitle(message.title)
        .setURL(process.env.BOT_URL)
        .setAuthor({
          name: process.env.BOT_NAME,
          iconURL: `https://robohash.org/${process.env.BOT_NAME}?gravatar=hashed`,
          url: process.env.BOT_URL
        })
        .setDescription(message.description ?? null);

      // Clear Fields Before Sending Another Message
      embed.setFields();

      if (message.fields) {
        if (Array.isArray(message.fields)) {
          message.fields.forEach(field => embed.addFields(field));
        } else {
          embed.addFields(message.fields);
        }
      }

      const components = [];
      if (message.buttons) {
        const buttons = message.buttons.map(button =>
          this.buttonBuilder.setCustomId(button.customId).setLabel(button.label).setStyle(button.style)
        );
        components.push(this.actionRowBuilder.addComponents(buttons));
      }

      await this.sendMessageChannel.send({ embeds: [embed], ...(components.length && { components }) });
    } catch (error) {
      console.error(error);
      throw new Error('Error while sending message');
    }
  }
}
