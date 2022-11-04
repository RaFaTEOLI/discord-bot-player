/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { faker } from '@faker-js/faker';
import { Song } from 'discord-music-player';

export const mockDiscordSongModel = (url = faker.internet.url()): Song =>
  ({
    name: faker.name.firstName(),
    author: faker.name.lastName(),
    url,
    thumbnail: faker.internet.url(),
    duration: faker.date.future().toString(),
    isLive: false,
    isFirst: false,
    seekTime: 10
  } as Song);
