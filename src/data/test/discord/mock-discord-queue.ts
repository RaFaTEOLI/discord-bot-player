import { mockDiscordPlaylistModel, mockDiscordSongModel } from '@/domain/test';
import { faker } from '@faker-js/faker';
import {
  Player,
  PlayerOptions,
  Playlist,
  ProgressBarOptions,
  Queue,
  RepeatMode,
  Song,
  StreamConnection
} from 'discord-music-player';
import { Guild } from 'discord.js';

export const mockDiscordQueue = (): Queue => {
  class DiscordPlayerQueue {
    player: Player;
    guild: Guild;
    connection: StreamConnection | undefined;
    songs: Song[];
    isPlaying: boolean;
    options: PlayerOptions;
    repeatMode: RepeatMode;
    destroyed: boolean;

    get volume(): number {
      return faker.datatype.number();
    }

    get paused(): boolean {
      return false;
    }

    get nowPlaying(): Song | undefined {
      return undefined;
    }

    async join(channel: string): Promise<any> {
      return await Promise.resolve();
    }

    async play(url: string): Promise<Song> {
      return await Promise.resolve(mockDiscordSongModel(url));
    }

    async playlist(url: string): Promise<Playlist> {
      return await Promise.resolve(mockDiscordPlaylistModel(url));
    }

    async seek(time: number): Promise<true | Song> {
      return await Promise.resolve(true);
    }

    skip(index?: number): any {
      return mockDiscordSongModel();
    }

    stop(): void {}

    shuffle(): Song[] | undefined {
      return undefined;
    }

    setPaused(state?: boolean): boolean | undefined {
      return undefined;
    }

    remove(index: number): Song | undefined {
      return undefined;
    }

    setVolume(volume: number): boolean {
      return true;
    }

    clearQueue(): void {}

    setRepeatMode(repeatMode: RepeatMode): boolean {
      return true;
    }

    createProgressBar(options?: ProgressBarOptions): any {
      return {
        [faker.database.column()]: faker.database.type()
      };
    }

    setData(data: any): void {}

    leave(): void {}
  }
  return new DiscordPlayerQueue() as Queue;
};
