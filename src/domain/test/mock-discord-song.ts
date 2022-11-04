import { faker } from '@faker-js/faker';

export const mockDiscordSongModel = (url = faker.internet.url()): any => ({
  name: faker.name.firstName(),
  author: faker.name.lastName(),
  url,
  thumbnail: faker.internet.url(),
  duration: faker.date.future().toString(),
  isLive: false,
  isFirst: false,
  seekTime: 10
});
