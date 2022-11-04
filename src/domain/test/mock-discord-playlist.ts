/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { faker } from '@faker-js/faker';
import { Playlist } from 'discord-music-player';
import { mockDiscordSongModel } from './mock-discord-song';

export const mockDiscordPlaylistModel = (url = faker.internet.url()): Playlist =>
  ({
    name: faker.name.firstName(),
    author: faker.name.lastName(),
    url,
    songs: [mockDiscordSongModel(), mockDiscordSongModel()]
  } as Playlist);
