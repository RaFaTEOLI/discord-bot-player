import { faker } from '@faker-js/faker';

export const mockDiscordMessage = (): any => {
  class DiscordMessageGuild {
    id: string;
    constructor() {
      this.id = faker.datatype.uuid();
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
