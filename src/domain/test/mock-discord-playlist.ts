/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { faker } from '@faker-js/faker';
import { mockDiscordSongModel } from './mock-discord-song';

export const mockDiscordPlaylistModel = (
  url = faker.internet.url()
): {
  name: string;
  author: string;
  url: string;
  songs: Array<ReturnType<typeof mockDiscordSongModel>>;
} => ({
  name: faker.name.firstName(),
  author: faker.name.lastName(),
  url,
  songs: [mockDiscordSongModel(), mockDiscordSongModel()]
});
