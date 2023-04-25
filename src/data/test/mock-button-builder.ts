import {
  ButtonBuilder,
  APIButtonComponent,
  APIMessageComponentEmoji,
  APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType
} from 'discord.js';

export const mockButtonBuilder = (): ButtonBuilder => {
  class ButtonBuilderStub implements ButtonBuilder {
    data: APIButtonComponentWithCustomId = {
      custom_id: '',
      label: '',
      style: ButtonStyle.Primary,
      type: ComponentType.Button
    };

    constructor(data?: Partial<APIButtonComponent>) {
      if (data) {
        this.data.disabled = data.disabled;
        this.data.emoji = data.emoji;
        this.data.label = data.label;
        this.data.style = data.style as any;
        this.data.type = data.type;
      }
    }

    setStyle(style: any): this {
      this.data.style = style;
      return this;
    }

    setURL(url: string): this {
      return this;
    }

    setCustomId(customId: string): this {
      this.data.custom_id = customId;
      return this;
    }

    setEmoji(emoji: APIMessageComponentEmoji): this {
      this.data.emoji = emoji;
      return this;
    }

    setDisabled(disabled?: boolean): this {
      this.data.disabled = disabled;
      return this;
    }

    setLabel(label: string): this {
      this.data.label = label;
      return this;
    }

    toJSON(): APIButtonComponent {
      return this.data;
    }
  }
  return new ButtonBuilderStub();
};
