import type { PlayMusicResult } from '@/domain/usecases/play-music';
import { PlayMusic } from '@/domain/usecases/play-music';
import { faker } from '@faker-js/faker';

export const mockDiscordPlayMusic = (): PlayMusic => {
  class DiscordPlayMusicStub implements PlayMusic {
    async play(url: string, _playlist?: boolean): Promise<PlayMusicResult> {
      return await Promise.resolve({
        url,
        isPlaylist: Boolean(_playlist),
        firstTitle: faker.lorem.words(3),
        trackCount: _playlist ? 2 : 1
      });
    }
  }
  return new DiscordPlayMusicStub();
};
