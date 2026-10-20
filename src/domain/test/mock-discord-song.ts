/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { faker } from '@faker-js/faker';
import type { QueuedTrack } from '@/domain/music/queued-track';

export const mockDiscordSongModel = (url = faker.internet.url()): QueuedTrack => ({
  id: faker.datatype.uuid(),
  name: faker.name.firstName(),
  author: faker.name.lastName(),
  url,
  thumbnail: faker.internet.url(),
  duration: '3:00',
  durationMs: 180_000,
  youtubeUrl: url
});
