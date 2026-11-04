import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client } from 'discord.js';
import type { QueuedTrack } from '@/domain/music/queued-track';
import { MusicRepeatMode } from '@/domain/music/repeat-mode';
import { GuildMusicSession, MAX_CONSECUTIVE_FAILURES } from './guild-music-session';
import { resolvePlayableUrl } from './resolve-playable-url';
import { createYoutubeAudioResource } from './youtube-audio-resource';

type FakeState = { status: string; resource?: FakeResource };
type FakeResource = { id: string; playbackDuration: number; playStream: { destroy: () => void } };

/** Mirrors @discordjs/voice: state changes emit synchronously, including `stop(true)` → Idle. */
class FakePlayer extends EventEmitter {
  state: FakeState = { status: 'idle' };

  setState (next: FakeState): void {
    const old = this.state;
    this.state = next;
    this.emit('stateChange', old, next);
    if (old.status !== next.status || old.resource !== next.resource) this.emit(next.status, old, next);
  }

  play = vi.fn((resource: FakeResource) => this.setState({ status: 'playing', resource }));
  stop = vi.fn((): boolean => {
    if (this.state.status === 'idle') return false;
    this.setState({ status: 'idle' });
    return true;
  });

  pause = vi.fn(() => this.setState({ ...this.state, status: 'paused' }));
  unpause = vi.fn(() => this.setState({ ...this.state, status: 'playing' }));

  /** The current resource's stream failed: 'error', then Idle (as the real player does). */
  failStream (): void {
    this.emit('error', new Error('stream failed'));
    this.setState({ status: 'idle' });
  }

  finishTrack (): void {
    this.setState({ status: 'idle' });
  }
}

const player = vi.hoisted(() => ({ current: null as unknown as FakePlayer }));

vi.mock('@discordjs/voice', async importOriginal => ({
  ...(await importOriginal<typeof import('@discordjs/voice')>()),
  createAudioPlayer: () => player.current,
  getVoiceConnection: () => undefined
}));
vi.mock('./resolve-playable-url', () => ({ resolvePlayableUrl: vi.fn() }));
vi.mock('./resolve-youtube-for-track', () => ({
  resolveYoutubeUrlForTrack: async (t: QueuedTrack) => t.youtubeUrl
}));
vi.mock('./youtube-audio-resource', () => ({ createYoutubeAudioResource: vi.fn() }));

const track = (name: string, extra: Partial<QueuedTrack> = {}): QueuedTrack => ({
  id: name,
  name,
  author: 'a',
  url: `https://youtu.be/${name}`,
  youtubeUrl: `https://youtu.be/${name}`,
  thumbnail: '',
  duration: '3:00',
  durationMs: 180_000,
  ...extra
});

const resourceFor = (url: string): FakeResource => ({
  id: url.slice(-1),
  playbackDuration: 1000,
  playStream: { destroy: vi.fn() }
});

const fakeClient: Partial<Client> = {};

const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

const setup = async (
  names: string[]
): Promise<{ session: GuildMusicSession, events: Array<[string, ...unknown[]]> }> => {
  const events: Array<[string, ...unknown[]]> = [];
  const session = new GuildMusicSession(fakeClient as Client, 'g1', (ev, ...args) => events.push([ev, ...args]), null);
  vi.mocked(resolvePlayableUrl).mockResolvedValueOnce({ tracks: names.map(n => track(n)), playlistName: 'p' });
  await session.enqueue('x');
  await flush();
  return { session, events };
};

const playedIds = (): string[] => player.current.play.mock.calls.map(([r]) => r.id);
const errorMessages = (events: Array<[string, ...unknown[]]>): string[] =>
  events.filter(([ev]) => ev === 'error').map(([, err]) => (err as Error).message);

describe('GuildMusicSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    player.current = new FakePlayer();
    vi.mocked(createYoutubeAudioResource).mockImplementation(async url => resourceFor(url) as never);
  });

  it('starts the first track', async () => {
    const { session } = await setup(['a', 'b']);
    expect(playedIds()).toEqual(['a']);
    expect(session.songs.map(s => s.id)).toEqual(['a', 'b']);
  });

  it('skip removes exactly one track (stop(true) fires Idle synchronously)', async () => {
    const { session } = await setup(['a', 'b', 'c']);
    session.skip();
    await flush();
    expect(session.songs.map(s => s.id)).toEqual(['b', 'c']);
    expect(playedIds()).toEqual(['a', 'b']);
  });

  it('removing the current track plays the next one only once', async () => {
    const { session } = await setup(['a', 'b', 'c']);
    session.remove(0);
    await flush();
    expect(session.songs.map(s => s.id)).toEqual(['b', 'c']);
    expect(playedIds()).toEqual(['a', 'b']);
  });

  it('a stream error drops exactly one track', async () => {
    const { session, events } = await setup(['a', 'b', 'c']);
    player.current.failStream();
    await flush();
    expect(session.songs.map(s => s.id)).toEqual(['b', 'c']);
    expect(playedIds()).toEqual(['a', 'b']);
    expect(errorMessages(events)).toEqual(['stream failed']);
  });

  it('drops a failing track even with track repeat on', async () => {
    const { session } = await setup(['a', 'b']);
    session.setRepeatMode(MusicRepeatMode.Track);
    player.current.failStream();
    await flush();
    expect(session.songs.map(s => s.id)).toEqual(['b']);
  });

  it('stops after too many consecutive failures with one summary error', async () => {
    vi.mocked(createYoutubeAudioResource).mockRejectedValue(new Error('YoutubeBlocked'));
    const names = ['a', 'b', 'c', 'd', 'e'];
    const { session, events } = await setup(names);
    expect(errorMessages(events)).toEqual([
      ...Array(MAX_CONSECUTIVE_FAILURES).fill('YoutubeBlocked'),
      'TooManyPlaybackFailures'
    ]);
    expect(session.songs).toHaveLength(0);
    expect(events.some(([ev]) => ev === 'queueEnd')).toBe(true);
  });

  it('resets the failure count once a track starts', async () => {
    vi.mocked(createYoutubeAudioResource)
      .mockRejectedValueOnce(new Error('VideoUnavailable'))
      .mockRejectedValueOnce(new Error('VideoUnavailable'))
      .mockImplementationOnce(async url => resourceFor(url) as never)
      .mockRejectedValueOnce(new Error('VideoUnavailable'))
      .mockRejectedValueOnce(new Error('VideoUnavailable'))
      .mockImplementationOnce(async url => resourceFor(url) as never);
    const { session, events } = await setup(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(playedIds()).toEqual(['c']);
    player.current.finishTrack();
    await flush();
    expect(playedIds()).toEqual(['c', 'f']);
    expect(errorMessages(events)).not.toContain('TooManyPlaybackFailures');
    expect(session.songs.map(s => s.id)).toEqual(['f']);
  });

  it('discards a load that a skip superseded', async () => {
    let releaseFirst: () => void = () => undefined;
    vi.mocked(createYoutubeAudioResource).mockImplementationOnce(
      async url => await new Promise(resolve => {
        releaseFirst = () => resolve(resourceFor(url) as never);
      })
    );
    const { session } = await setup(['a', 'b']);
    session.skip();
    await flush();
    releaseFirst();
    await flush();
    expect(playedIds()).toEqual(['b']);
  });

  it('does not start a second load when a song is queued while one is loading', async () => {
    let release: () => void = () => undefined;
    vi.mocked(createYoutubeAudioResource).mockImplementationOnce(
      async url => await new Promise(resolve => {
        release = () => resolve(resourceFor(url) as never);
      })
    );
    const { session } = await setup(['a']);
    vi.mocked(resolvePlayableUrl).mockResolvedValueOnce({ tracks: [track('b')] });
    await session.enqueue('y');
    release();
    await flush();
    expect(playedIds()).toEqual(['a']);
    expect(createYoutubeAudioResource).toHaveBeenCalledTimes(1);
  });

  it('passes the music hint to stream creation', async () => {
    const session = new GuildMusicSession(fakeClient as Client, 'g1', () => undefined, null);
    vi.mocked(resolvePlayableUrl).mockResolvedValueOnce({ tracks: [track('m', { isMusic: true })] });
    await session.enqueue('x');
    await flush();
    expect(createYoutubeAudioResource).toHaveBeenCalledWith('https://youtu.be/m', 150, {
      startMs: 0,
      preferMusicClient: true
    });
  });

  describe('seek', () => {
    it('restarts the current track at the offset and offsets the progress bar', async () => {
      const { session } = await setup(['a', 'b']);
      await expect(session.seek(90_000)).resolves.toBe(true);
      expect(createYoutubeAudioResource).toHaveBeenLastCalledWith('https://youtu.be/a', 150, {
        startMs: 90_000,
        preferMusicClient: undefined
      });
      expect(session.songs.map(s => s.id)).toEqual(['a', 'b']);
      // 90 s offset + 1 s played by the fake resource.
      expect(session.createProgressBar().prettier).toContain('[1:31/3:00]');
    });

    it('refuses offsets outside the track and when nothing plays', async () => {
      const { session } = await setup(['a']);
      await expect(session.seek(-1)).resolves.toBe(false);
      await expect(session.seek(180_000)).resolves.toBe(false);
      await expect(session.seek(Number.NaN)).resolves.toBe(false);
      session.stop();
      await expect(session.seek(1000)).resolves.toBe(false);
    });

    it('keeps the current resource when seeking fails', async () => {
      const { session } = await setup(['a']);
      vi.mocked(createYoutubeAudioResource).mockRejectedValueOnce(new Error('SeekUnsupported'));
      await expect(session.seek(1000)).resolves.toBe(false);
      expect(playedIds()).toEqual(['a']);
    });

    it('stays paused when seeking while paused', async () => {
      const { session } = await setup(['a']);
      session.setPaused(true);
      await session.seek(1000);
      expect(player.current.pause).toHaveBeenCalledTimes(2);
      expect(player.current.state.status).toBe('paused');
    });
  });
});
