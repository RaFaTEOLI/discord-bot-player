import { APIMessage } from 'discord.js';

export const mockDiscordAPIMessage = (): APIMessage =>
  ({
    channel_id: '831310751405834264',
    id: '1035547045060165772',
    edited_timestamp: '2023-03-28T20:14:15.000Z',
    type: 0,
    content: '',
    author: {
      id: '833821408349126696',
      bot: true,
      system: false,
      username: 'Rubeo',
      discriminator: '3047',
      avatar: 'e948aa4e0f731fc357076ed65be9a4a0',
      banner: undefined,
      verified: true,
      global_name: undefined
    },
    pinned: false,
    tts: false,
    nonce: null,
    components: [],
    position: null,
    webhook_id: null,
    application_id: null,
    interaction: null,
    activity: {
      type: 1,
      party_id: '1234567890abcdef'
    }
  } as unknown as APIMessage);
