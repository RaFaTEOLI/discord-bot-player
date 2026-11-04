import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePlayableUrl } from './resolve-playable-url';
import { resolveYoutubeUrlForTrack } from './resolve-youtube-for-track';
import { getYoutubeClient } from './youtube-client';

vi.mock('./youtube-client', () => ({ getYoutubeClient: vi.fn() }));

const ID = 'dQw4w9WgXcQ';
const text = (s: string): { toString: () => string } => ({ toString: () => s });

const videoNode = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'Video',
  video_id: id,
  title: text(`Title ${id}`),
  author: { name: 'Artist' },
  duration: { seconds: 214 },
  is_live: false,
  ...extra
});

const playlistNode = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'PlaylistVideo',
  id,
  title: text(`Item ${id}`),
  author: { name: 'Uploader' },
  duration: { seconds: 3725 },
  is_live: false,
  is_playable: true,
  ...extra
});

const mockClient = (client: Record<string, unknown>): void => {
  vi.mocked(getYoutubeClient).mockResolvedValue(client as never);
};

describe('resolvePlayableUrl (YouTube)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves a single video from basic info', async () => {
    const getBasicInfo = vi.fn(async () => ({
      basic_info: { id: ID, title: 'Never Gonna Give You Up', author: 'Rick Astley', duration: 214 }
    }));
    mockClient({ getBasicInfo });
    const { tracks, playlistName } = await resolvePlayableUrl(`https://youtu.be/${ID}`, {});
    expect(getBasicInfo).toHaveBeenCalledWith(ID);
    expect(playlistName).toBeUndefined();
    expect(tracks[0]).toMatchObject({
      name: 'Never Gonna Give You Up',
      author: 'Rick Astley',
      duration: '3:34',
      durationMs: 214000,
      youtubeUrl: `https://www.youtube.com/watch?v=${ID}`,
      thumbnail: `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`
    });
  });

  it('marks videos in the Music category as music', async () => {
    mockClient({ getBasicInfo: vi.fn(async () => ({ basic_info: { id: ID, category: 'Music' } })) });
    const { tracks } = await resolvePlayableUrl(`https://youtu.be/${ID}`, {});
    expect(tracks[0].isMusic).toBe(true);
  });

  it('uses the playlist of a watch URL when forcePlaylist is set', async () => {
    const getPlaylist = vi.fn(async () => ({ info: { title: 'L' }, items: [playlistNode(ID)], has_continuation: false }));
    mockClient({ getPlaylist });
    const { playlistName } = await resolvePlayableUrl(`https://www.youtube.com/watch?v=${ID}&list=PL9`, {
      forcePlaylist: true
    });
    expect(getPlaylist).toHaveBeenCalledWith('PL9');
    expect(playlistName).toBe('L');
  });

  it('rejects live videos', async () => {
    mockClient({ getBasicInfo: vi.fn(async () => ({ basic_info: { is_live: true } })) });
    await expect(resolvePlayableUrl(`https://www.youtube.com/watch?v=${ID}`, {})).rejects.toThrow('LiveUnsupported');
  });

  it('uses the first non-live search hit', async () => {
    const search = vi.fn(async () => ({
      results: [{ type: 'Shelf' }, videoNode('aaaaaaaaaaa', { is_live: true }), videoNode('bbbbbbbbbbb')]
    }));
    mockClient({ search });
    const { tracks } = await resolvePlayableUrl('rick astley', {});
    expect(search).toHaveBeenCalledWith('rick astley', { type: 'video' });
    expect(tracks[0].youtubeUrl).toBe('https://www.youtube.com/watch?v=bbbbbbbbbbb');
  });

  it('accepts LockupView search results', async () => {
    mockClient({
      search: vi.fn(async () => ({
        results: [
          { type: 'LockupView', content_type: 'PLAYLIST', content_id: 'PLx' },
          { type: 'LockupView', content_type: 'VIDEO', content_id: 'ccccccccccc', metadata: { title: text('Lockup') } }
        ]
      }))
    });
    const { tracks } = await resolvePlayableUrl('lockup', {});
    expect(tracks[0]).toMatchObject({ name: 'Lockup', author: 'Unknown', duration: '0:00' });
  });

  it('throws SearchIsNull when nothing matches', async () => {
    mockClient({ search: vi.fn(async () => ({ results: [] })) });
    await expect(resolvePlayableUrl('nothing', {})).rejects.toThrow('SearchIsNull');
  });

  it('follows playlist continuations and skips live/unplayable items', async () => {
    const page2 = {
      items: [playlistNode('ddddddddddd'), playlistNode('eeeeeeeeeee', { is_playable: false })],
      has_continuation: false
    };
    const page1 = {
      info: { title: 'Mix' },
      items: [playlistNode('aaaaaaaaaaa'), playlistNode('bbbbbbbbbbb', { is_live: true })],
      has_continuation: true,
      getContinuation: vi.fn(async () => page2)
    };
    const getPlaylist = vi.fn(async () => page1);
    mockClient({ getPlaylist });
    const { tracks, playlistName } = await resolvePlayableUrl('https://www.youtube.com/playlist?list=PL1', {});
    expect(getPlaylist).toHaveBeenCalledWith('PL1');
    expect(playlistName).toBe('Mix');
    expect(tracks.map(t => t.youtubeUrl?.slice(-11))).toEqual(['aaaaaaaaaaa', 'ddddddddddd']);
    expect(tracks[0].duration).toBe('1:02:05');
  });

  it('caps playlists at 500 tracks', async () => {
    const page = {
      info: {},
      items: Array.from({ length: 300 }, (_, i) => playlistNode(`v${i.toString().padStart(10, '0')}`)),
      has_continuation: true,
      getContinuation: vi.fn(async () => page)
    };
    mockClient({ getPlaylist: vi.fn(async () => page) });
    const { tracks, playlistName } = await resolvePlayableUrl('https://www.youtube.com/playlist?list=PL2', {});
    expect(tracks).toHaveLength(500);
    expect(page.getContinuation).toHaveBeenCalledTimes(1);
    expect(playlistName).toBe('YouTube playlist');
  });

  it('rejects unsupported links', async () => {
    await expect(resolvePlayableUrl('https://soundcloud.com/a/b', {})).rejects.toThrow('UnsupportedSource');
  });

  it('requires Spotify credentials for Spotify links', async () => {
    await expect(resolvePlayableUrl('https://open.spotify.com/track/abc', { spotify: null })).rejects.toThrow(
      'SpotifyNotConfigured'
    );
  });
});

describe('resolveYoutubeUrlForTrack', () => {
  const base = { id: '1', name: 'n', author: 'a', url: '', thumbnail: '', duration: '0:00' };

  it('returns a known YouTube URL without searching', async () => {
    await expect(resolveYoutubeUrlForTrack({ ...base, youtubeUrl: 'https://youtu.be/x' })).resolves.toBe(
      'https://youtu.be/x'
    );
  });

  it('searches the Spotify bridge query', async () => {
    const search = vi.fn(async () => ({ results: [videoNode(ID)] }));
    mockClient({ search });
    await expect(resolveYoutubeUrlForTrack({ ...base, youtubeSearchQuery: 'a — n' })).resolves.toBe(
      `https://www.youtube.com/watch?v=${ID}`
    );
    expect(search).toHaveBeenCalledWith('a — n', { type: 'video' });
  });

  it('fails without a URL or query', async () => {
    await expect(resolveYoutubeUrlForTrack(base)).rejects.toThrow('VideoUnavailable');
  });
});
