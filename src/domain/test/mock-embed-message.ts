import { MessageModel } from '@/domain/models/message';

export const mockEmbedMessage = (): MessageModel => ({
  data: {
    color: 39423,
    title: 'any_title',
    url: 'https://discord.js.org/',
    author: {
      name: 'Rubeo',
      url: undefined,
      icon_url: 'https://robohash.org/Rubeo?gravatar=hashed'
    },
    description: undefined
  }
});
