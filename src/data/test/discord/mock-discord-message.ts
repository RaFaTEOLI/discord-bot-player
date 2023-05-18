import { faker } from '@faker-js/faker';
import { Collection, Snowflake, GuildMember } from 'discord.js';

export const mockDiscordMessage = (): any => {
  const iterable: Iterable<readonly [Snowflake, GuildMember]> = {
    [faker.datatype.uuid()]: {
      id: faker.datatype.uuid(),
      name: faker.internet.userName()
    },
    [Symbol.iterator]() {
      return {
        next() {
          return {
            done: true,
            value: this
          };
        }
      };
    }
  };
  class DiscordMessageChannel {
    cache: Array<{
      type: number;
      id: string;
      members: Collection<Snowflake, GuildMember>;
    }>;

    constructor() {
      this.cache = [
        {
          type: 2,
          id: faker.datatype.uuid(),
          members: new Collection(iterable)
        }
      ];
    }
  }

  class DiscordMessageGuild {
    id: string;
    channels: DiscordMessageChannel;
    constructor() {
      this.id = faker.datatype.uuid();
      this.channels = new DiscordMessageChannel();
    }
  }

  class DiscordMessageVoice {
    channel: string;
    constructor() {
      this.channel = faker.datatype.uuid();
    }
  }

  class DiscordMessageMember {
    voice: DiscordMessageVoice;
    constructor() {
      this.voice = new DiscordMessageVoice();
    }
  }

  class DiscordMessageStub {
    guild: DiscordMessageGuild;
    member: DiscordMessageMember;
    constructor() {
      this.guild = new DiscordMessageGuild();
      this.member = new DiscordMessageMember();
    }
  }
  return new DiscordMessageStub();
};
