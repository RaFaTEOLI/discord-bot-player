import { faker } from '@faker-js/faker';
import type { IGuildMusicQueue, PlayMusicResult, ProgressBarView } from '@/domain/music/guild-music-queue';
import { MusicRepeatMode } from '@/domain/music/repeat-mode';
import type { QueuedTrack } from '@/domain/music/queued-track';
import { mockDiscordSongModel } from '@/domain/test/mock-discord-song';

export const mockDiscordQueue = (): IGuildMusicQueue => {
  class GuildMusicQueueStub implements IGuildMusicQueue {
    guildId = faker.datatype.uuid();
    guild = undefined;
    songs: QueuedTrack[] = [mockDiscordSongModel(), mockDiscordSongModel()];
    nowPlaying: QueuedTrack | undefined = mockDiscordSongModel();
    volume = faker.datatype.number({ min: 50, max: 200 });
    paused = false;
    isPlaying = true;
    destroyed = false;

    async join(_channel: unknown): Promise<void> {
      await Promise.resolve();
    }

    async enqueue(url: string, _options?: { forcePlaylist?: boolean }): Promise<PlayMusicResult> {
      return await Promise.resolve({
        url,
        isPlaylist: false,
        firstTitle: faker.lorem.words(3),
        trackCount: 1
      });
    }

    skip(_count?: number): void {}

    stop(): void {}

    setRepeatMode(_mode: MusicRepeatMode): void {}

    setVolume(_volume: number): void {}

    clearQueue(): void {}

    shuffle(): void {}

    remove(_index: number): void {}

    move(_fromIndex: number, _toIndex: number): void {}

    setPaused(_paused: boolean): void {}

    seek(_ms: number): void {}

    createProgressBar(): ProgressBarView {
      return {
        prettier: '[==============>][0:00/0:00]'
      };
    }

    leave(): void {}
  }
  return new GuildMusicQueueStub();
};
