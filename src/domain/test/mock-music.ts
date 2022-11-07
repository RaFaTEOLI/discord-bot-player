import { MusicModel } from '@/domain/models/music';
import { faker } from '@faker-js/faker';

export const mockMusicModel = (): MusicModel => {
  return {
    name: faker.random.word()
  };
};
