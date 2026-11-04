import type { Client, Guild, VoiceBasedChannel } from 'discord.js';
import type { QueuedTrack } from './queued-track';
import type { MusicRepeatMode } from './repeat-mode';

export interface PlayMusicResult {
  url: string;
  isPlaylist: boolean;
  firstTitle: string;
  trackCount: number;
}

export interface ProgressBarView {
  prettier: string;
}

export interface IGuildMusicQueue {
  readonly guildId: string;
  readonly guild: Guild | undefined;
  readonly songs: QueuedTrack[];
  readonly nowPlaying: QueuedTrack | undefined;
  readonly volume: number;
  readonly paused: boolean;
  readonly isPlaying: boolean;
  readonly destroyed: boolean;
  join: (channel: VoiceBasedChannel | string) => Promise<void>;
  enqueue: (url: string, options?: { forcePlaylist?: boolean }) => Promise<PlayMusicResult>;
  skip: (count?: number) => void;
  stop: () => void;
  setRepeatMode: (mode: MusicRepeatMode) => void;
  setVolume: (volume: number) => void;
  clearQueue: () => void;
  shuffle: () => void;
  remove: (index: number) => void;
  move: (fromIndex: number, toIndex: number) => void;
  setPaused: (paused: boolean) => void;
  /** Restarts the current track at `ms`; resolves false when it can't (nothing playing, out of range, unsupported format). */
  seek: (ms: number) => Promise<boolean>;
  createProgressBar: () => ProgressBarView;
  leave: () => void;
}

export type MusicPlayerEventCallback = (...args: unknown[]) => void;

export interface MusicPlayerFacade {
  createQueue: (guildId: string) => IGuildMusicQueue;
  getQueue: (guildId: string) => IGuildMusicQueue | undefined;
  on: (event: string, listener: MusicPlayerEventCallback) => this;
  off: (event: string, listener: MusicPlayerEventCallback) => this;
  emit: (event: string, ...args: unknown[]) => boolean;
  setup: (client: Client) => void;
}
