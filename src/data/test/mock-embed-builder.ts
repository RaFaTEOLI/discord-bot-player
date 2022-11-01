import {
  APIEmbed,
  APIEmbedField,
  ColorResolvable,
  EmbedAuthorOptions,
  EmbedBuilder,
  EmbedFooterOptions,
  RestOrArray
} from 'discord.js';
/*
  data: {
    color: 39423,
    title: 'any_title',
    url: 'https://discord.js.org/',
    author: {
      name: 'Rubeo',
      url: undefined,
      icon_url: 'https://robohash.org/Rubeo?gravatar=hashed',
    },
    description: undefined,
  },
*/

export const mockEmbedBuilder = (): EmbedBuilder => {
  class EmbedBuilderStub implements EmbedBuilder {
    data: APIEmbed;
    constructor(data?: APIEmbed) {
      this.data = data;
    }

    setDescription(description: string | null): this {
      this.data = {
        ...this.data,
        description: description ?? undefined
      };
      return this;
    }

    setThumbnail(url: string | null): this {
      this.data = {
        ...this.data,
        thumbnail: { url: url ?? 'https://robohash.org/Discord' }
      };
      return this;
    }

    setImage(url: string | null): this {
      this.data = {
        ...this.data,
        image: { url: url ?? 'https://robohash.org/Discord' }
      };
      return this;
    }

    setTitle(title: string | null): this {
      this.data = {
        ...this.data,
        title: title ?? undefined
      };
      return this;
    }

    setFields(...fields: RestOrArray<APIEmbedField>): this {
      return this;
    }

    setTimestamp(timestamp?: number | Date | null | undefined): this {
      this.data = {
        ...this.data,
        timestamp: timestamp?.toString() ?? '2020-01-01'
      };
      return this;
    }

    setURL(url: string | null): this {
      this.data = {
        ...this.data,
        url: url ?? undefined
      };
      return this;
    }

    setAuthor(options: EmbedAuthorOptions | null): this {
      if (options) {
        this.data = {
          ...this.data,
          author: options
        };
      }
      return this;
    }

    setFooter(options: EmbedFooterOptions | null): this {
      if (options) {
        this.data = {
          ...this.data,
          footer: options
        };
      }
      return this;
    }

    setColor(color: ColorResolvable | null): this {
      if (color) {
        this.data = {
          ...this.data,
          color: color as number
        };
      }
      return this;
    }

    addFields(...fields: RestOrArray<APIEmbedField>): this {
      this.data = {
        ...this.data,
        fields: fields as APIEmbedField[]
      };
      return this;
    }

    spliceFields(
      index: number,
      deleteCount: number,
      ...fields: APIEmbedField[]
    ): this {
      return this;
    }

    toJSON(): APIEmbed {
      return this.data;
    }
  }
  return new EmbedBuilderStub();
};
