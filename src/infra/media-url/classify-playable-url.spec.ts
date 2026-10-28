import { describe, expect, it } from 'vitest';
import { classifyPlayableUrl, extractYoutubeVideoId } from './classify-playable-url';

const ID = 'dQw4w9WgXcQ';

describe('classifyPlayableUrl', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}?feature=share`,
    `https://www.youtube.com/embed/${ID}`,
    `youtu.be/${ID}`,
    `  https://www.youtube.com/watch?v=${ID}  `
  ])('classifies %s as a YouTube video', url => {
    expect(classifyPlayableUrl(url)).toEqual({ kind: 'youtube-video', videoId: ID });
  });

  it('keeps watch URLs with a list as a single video', () => {
    expect(classifyPlayableUrl(`https://www.youtube.com/watch?v=${ID}&list=PL123`)).toEqual({
      kind: 'youtube-video',
      videoId: ID
    });
  });

  it('classifies playlist URLs', () => {
    expect(classifyPlayableUrl('https://www.youtube.com/playlist?list=PLabc_123')).toEqual({
      kind: 'youtube-playlist',
      playlistId: 'PLabc_123'
    });
  });

  it.each([
    'https://www.youtube.com/playlist',
    'https://www.youtube.com/@channel',
    'https://www.youtube.com/watch?v=short',
    'https://youtu.be/',
    'https://www.youtube.com/shorts/tooShort'
  ])('treats %s as unsupported', url => {
    expect(classifyPlayableUrl(url)).toEqual({ kind: 'unsupported' });
  });

  it.each([
    ['https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', 'track', '4uLU6hMCjMI75M1A2tKUQC'],
    ['https://open.spotify.com/intl-pt/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x', 'playlist', '37i9dQZF1DXcBWIGoYBM5M'],
    ['open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3', 'album', '1DFixLWuPkv3KT3TnV35m3']
  ])('classifies Spotify %s', (url, resource, id) => {
    expect(classifyPlayableUrl(url)).toEqual({ kind: 'spotify', resource, id });
  });

  it.each([
    'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF',
    'https://soundcloud.com/artist/track',
    'https://www.deezer.com/track/3135556',
    'https://example.com/song.mp3',
    'https://exa mple.com/x',
    'exa_mple.com/%%'
  ])('treats %s as unsupported', url => {
    expect(classifyPlayableUrl(url)).toEqual({ kind: 'unsupported' });
  });

  it('treats an unparsable bare host as a search', () => {
    expect(classifyPlayableUrl('xn--a.com/x')).toEqual({ kind: 'search', query: 'xn--a.com/x' });
  });

  it.each(['never gonna give you up', 'artist — song', 'AC/DC back in black'])('treats "%s" as a search', q => {
    expect(classifyPlayableUrl(` ${q} `)).toEqual({ kind: 'search', query: q });
  });
});

describe('extractYoutubeVideoId', () => {
  it('accepts a bare id', () => {
    expect(extractYoutubeVideoId(ID)).toBe(ID);
  });

  it('extracts from URLs', () => {
    expect(extractYoutubeVideoId(`https://youtu.be/${ID}`)).toBe(ID);
    expect(extractYoutubeVideoId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it('returns null for non-YouTube input', () => {
    expect(extractYoutubeVideoId('https://example.com/watch?v=x')).toBeNull();
    expect(extractYoutubeVideoId('not a url')).toBeNull();
  });
});
