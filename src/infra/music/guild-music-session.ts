import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  joinVoiceChannel
} from '@discordjs/voice';
import type { Client, Guild, VoiceBasedChannel } from 'discord.js';
import type { IGuildMusicQueue, PlayMusicResult, ProgressBarView } from '@/domain/music/guild-music-queue';
import { MusicRepeatMode } from '@/domain/music/repeat-mode';
import type { QueuedTrack } from '@/domain/music/queued-track';
import { resolvePlayableUrl, type SpotifyCredentials } from './resolve-playable-url';
import { resolveYoutubeUrlForTrack } from './resolve-youtube-for-track';
import { createYoutubeAudioResource } from './youtube-audio-resource';

export class GuildMusicSession implements IGuildMusicQueue {
  public voiceChannelId: string | null = null;
  private readonly tracks: QueuedTrack[] = [];
  private repeatMode = MusicRepeatMode.Disabled;
  private volumePercent = 150;
  private userPaused = false;
  private isDestroyed = false;
  private playing = false;
  private lastStartedId: string | null = null;
  private previousTrackSnapshot: QueuedTrack | null = null;

  private readonly audioPlayer = createAudioPlayer();

  constructor(
    private readonly client: Client,
    public readonly guildId: string,
    private readonly emitPlayer: (event: string, ...args: unknown[]) => void,
    private readonly spotifyCreds: SpotifyCredentials | null
  ) {
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      void this.onIdle();
    });
    this.audioPlayer.on('error', err => {
      console.error(err);
      this.emitPlayer('error', err, this);
      this.tracks.shift();
      void this.playNext();
    });
    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (newState.status !== AudioPlayerStatus.Playing || oldState.status === AudioPlayerStatus.Playing) {
        return;
      }
      const cur = this.tracks[0];
      if (!cur) return;
      if (this.lastStartedId === null) {
        this.emitPlayer('songFirst', this, cur);
        this.previousTrackSnapshot = { ...cur };
        this.lastStartedId = cur.id;
        return;
      }
      if (this.lastStartedId !== cur.id) {
        const previous = this.previousTrackSnapshot;
        this.emitPlayer('songChanged', this, cur, previous);
        this.previousTrackSnapshot = { ...cur };
        this.lastStartedId = cur.id;
      }
    });
  }

  get guild(): Guild | undefined {
    return this.client.guilds.cache.get(this.guildId);
  }

  get songs(): QueuedTrack[] {
    return this.tracks;
  }

  get nowPlaying(): QueuedTrack | undefined {
    return this.tracks[0];
  }

  get volume(): number {
    return this.volumePercent;
  }

  get paused(): boolean {
    return this.userPaused;
  }

  get isPlaying(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing && !this.userPaused;
  }

  get destroyed(): boolean {
    return this.isDestroyed;
  }

  async join(channel: VoiceBasedChannel | string): Promise<void> {
    const guild = this.guild;
    if (!guild) throw new Error('Guild not found');
    const channelId = typeof channel === 'string' ? channel : channel.id;
    const ch = guild.channels.cache.get(channelId);
    if (!ch?.isVoiceBased()) throw new Error('VoiceChannelTypeInvalid');
    const existing = getVoiceConnection(this.guildId);
    if (existing) {
      existing.destroy();
    }
    const connection = joinVoiceChannel({
      channelId: ch.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true
    });
    connection.on(VoiceConnectionStatus.Disconnected, () => {
      this.emitPlayer('clientDisconnect', this);
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000).catch(() => undefined);
    connection.subscribe(this.audioPlayer);
    this.voiceChannelId = ch.id;
  }

  async enqueue(url: string, options?: { forcePlaylist?: boolean }): Promise<PlayMusicResult> {
    const { tracks, playlistName } = await resolvePlayableUrl(url, {
      forcePlaylist: options?.forcePlaylist,
      spotify: this.spotifyCreds
    });
    if (!tracks.length) {
      return { url, isPlaylist: false, firstTitle: '', trackCount: 0 };
    }
    const isPlaylistBatch = Boolean(playlistName) || tracks.length > 1;
    if (isPlaylistBatch) {
      for (const t of tracks) this.tracks.push(t);
      this.emitPlayer('playlistAdd', this, {
        name: playlistName ?? 'Playlist',
        songs: tracks
      });
    } else {
      const only = tracks[0];
      this.tracks.push(only);
      this.emitPlayer('songAdd', this, only);
    }
    if (!this.playing && !this.userPaused && this.tracks.length > 0) {
      void this.playNext();
    }
    return {
      url,
      isPlaylist: isPlaylistBatch,
      firstTitle: tracks[0].name,
      trackCount: tracks.length
    };
  }

  skip(count?: number): void {
    const n = count !== undefined && Number.isInteger(count) && count > 0 ? Math.min(count, this.tracks.length) : 1;
    this.tracks.splice(0, Math.min(n, this.tracks.length));
    this.audioPlayer.stop(true);
    void this.playNext();
  }

  stop(): void {
    this.isDestroyed = true;
    this.tracks.length = 0;
    this.playing = false;
    this.lastStartedId = null;
    this.previousTrackSnapshot = null;
    this.audioPlayer.stop(true);
    this.disconnectVoice();
    this.emitPlayer('queueDestroyed', this);
  }

  setRepeatMode(mode: MusicRepeatMode): void {
    this.repeatMode = mode;
  }

  setVolume(volume: number): void {
    this.volumePercent = volume;
    const st = this.audioPlayer.state;
    if (st.status === AudioPlayerStatus.Playing && st.resource.volume) {
      st.resource.volume.setVolume(Math.min(2, Math.max(0, volume / 100)));
    }
  }

  clearQueue(): void {
    if (this.tracks.length > 1) {
      this.tracks.splice(1);
    }
  }

  shuffle(): void {
    if (this.tracks.length < 3) return;
    const rest = this.tracks.slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    this.tracks.splice(1, this.tracks.length - 1, ...rest);
  }

  remove(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.tracks.length) return;
    this.tracks.splice(index, 1);
    if (index === 0) {
      this.audioPlayer.stop(true);
      void this.playNext();
    }
  }

  move(fromIndex: number, toIndex: number): void {
    if (
      !Number.isInteger(fromIndex) ||
      !Number.isInteger(toIndex) ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tracks.length ||
      toIndex >= this.tracks.length
    ) {
      return;
    }
    const [item] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, item);
  }

  setPaused(paused: boolean): void {
    this.userPaused = paused;
    if (paused) {
      this.audioPlayer.pause();
    } else {
      this.audioPlayer.unpause();
      if (!this.playing && this.tracks.length > 0) {
        void this.playNext();
      }
    }
  }

  seek(_ms: number): void {}

  createProgressBar(): ProgressBarView {
    const cur = this.tracks[0];
    const st = this.audioPlayer.state;
    let elapsedMs = 0;
    if (st.status === AudioPlayerStatus.Playing && 'resource' in st && st.resource) {
      elapsedMs = st.resource.playbackDuration ?? 0;
    }
    const totalMs = cur?.durationMs ?? 0;
    const fmt = (ms: number): string => {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };
    if (!cur || !totalMs) {
      return { prettier: '[==============>][0:00/0:00]' };
    }
    const frac = Math.min(1, elapsedMs / totalMs);
    const width = 14;
    const filled = Math.round(frac * width);
    const bar = `[${'='.repeat(Math.max(0, filled - 1))}${filled > 0 ? '>' : ''}${' '.repeat(Math.max(0, width - filled))}]`;
    return { prettier: `${bar}[${fmt(elapsedMs)}/${fmt(totalMs)}]` };
  }

  leave(): void {
    this.disconnectVoice();
  }

  channelEmptyCleanup(): void {
    this.isDestroyed = true;
    this.tracks.length = 0;
    this.playing = false;
    this.lastStartedId = null;
    this.previousTrackSnapshot = null;
    this.audioPlayer.stop(true);
    this.disconnectVoice();
  }

  private disconnectVoice(): void {
    const c = getVoiceConnection(this.guildId);
    if (c) {
      c.destroy();
    }
    this.voiceChannelId = null;
  }

  private async onIdle(): Promise<void> {
    if (this.isDestroyed || this.userPaused) return;
    if (this.tracks.length === 0) return;
    this.applyRepeatAfterTrackEnd();
    if (this.tracks.length === 0) {
      this.onQueueExhausted();
      return;
    }
    await this.playNext();
  }

  private applyRepeatAfterTrackEnd(): void {
    if (this.repeatMode === MusicRepeatMode.Track) {
      return;
    }
    if (this.repeatMode === MusicRepeatMode.Queue && this.tracks.length > 0) {
      const first = this.tracks.shift();
      if (first) this.tracks.push(first);
      return;
    }
    this.tracks.shift();
  }

  private onQueueExhausted(): void {
    this.playing = false;
    this.lastStartedId = null;
    this.previousTrackSnapshot = null;
    this.disconnectVoice();
    this.emitPlayer('queueEnd', this);
  }

  private async playNext(): Promise<void> {
    if (this.isDestroyed || this.userPaused) return;
    if (this.tracks.length === 0) {
      this.onQueueExhausted();
      return;
    }
    const track = this.tracks[0];
    try {
      const ytUrl = await resolveYoutubeUrlForTrack(track);
      const resource = await createYoutubeAudioResource(ytUrl, this.volumePercent);
      this.audioPlayer.play(resource);
      this.playing = true;
    } catch (e) {
      console.error(e);
      this.emitPlayer('error', e, this);
      this.tracks.shift();
      await this.playNext();
    }
  }
}
