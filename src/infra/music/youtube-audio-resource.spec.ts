import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamType } from '@discordjs/voice';
import { createYoutubeAudioResource } from './youtube-audio-resource';
import { getYoutubeClient, getYoutubeStreamClients } from './youtube-client';
import { getPoTokenMinter, withStreamPoToken } from './youtube-po-token';

const setVolume = vi.fn();
const createAudioResource = vi.fn((_stream: unknown, _opts: unknown) => ({ volume: { setVolume } }));

vi.mock('@discordjs/voice', async importOriginal => ({
  ...(await importOriginal<typeof import('@discordjs/voice')>()),
  createAudioResource: (stream: unknown, opts: unknown) => createAudioResource(stream, opts)
}));

vi.mock('./youtube-client', () => ({
  getYoutubeClient: vi.fn(),
  getYoutubeStreamClients: vi.fn()
}));

vi.mock('./youtube-po-token', () => ({
  getPoTokenMinter: vi.fn(),
  withStreamPoToken: vi.fn(async (_yt: unknown, _token: string, fn: () => Promise<unknown>) => await fn())
}));

const ID = 'dQw4w9WgXcQ';

const webStream = (chunks: Uint8Array[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start (c) {
      for (const chunk of chunks) c.enqueue(chunk);
      c.close();
    }
  });

const makeInfo = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  basic_info: { is_live: false },
  chooseFormat: vi.fn(),
  download: vi.fn(async () => webStream([new Uint8Array([1, 2, 3])])),
  ...overrides
});

const mockGetInfo = (...infos: Array<Record<string, unknown> | Error>): ReturnType<typeof vi.fn> => {
  const getInfo = vi.fn();
  for (const i of infos) {
    if (i instanceof Error) getInfo.mockRejectedValueOnce(i);
    else getInfo.mockResolvedValueOnce(i);
  }
  const client = { getInfo };
  vi.mocked(getYoutubeClient).mockResolvedValue(client as never);
  return getInfo;
};

describe('createYoutubeAudioResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(getYoutubeStreamClients).mockReturnValue(['MWEB', 'IOS']);
    vi.mocked(getPoTokenMinter).mockResolvedValue(null);
  });

  it('rejects input without a video id', async () => {
    await expect(createYoutubeAudioResource('https://example.com', 100)).rejects.toThrow('VideoUnavailable');
  });

  it('streams WebM/Opus with scaled volume', async () => {
    const info = makeInfo();
    const getInfo = mockGetInfo(info);
    await createYoutubeAudioResource(`https://youtu.be/${ID}`, 150);
    expect(getInfo).toHaveBeenCalledWith(ID, { client: 'MWEB', po_token: undefined });
    expect(info.download).toHaveBeenCalledWith(expect.objectContaining({ format: 'webm', codec: 'opus' }));
    expect(createAudioResource.mock.calls[0][1]).toEqual({ inputType: StreamType.WebmOpus, inlineVolume: true });
    expect(setVolume).toHaveBeenCalledWith(1.5);
  });

  it('clamps volume to 0..2', async () => {
    mockGetInfo(makeInfo());
    await createYoutubeAudioResource(ID, 500);
    expect(setVolume).toHaveBeenCalledWith(2);
  });

  it('keeps every chunk, including the primed first one', async () => {
    mockGetInfo(makeInfo({ download: vi.fn(async () => webStream([new Uint8Array([1]), new Uint8Array([2, 3])])) }));
    await createYoutubeAudioResource(ID, 100);
    const stream = createAudioResource.mock.calls[0][0] as AsyncIterable<Buffer>;
    const bytes: number[] = [];
    for await (const chunk of stream) bytes.push(...chunk);
    expect(bytes).toEqual([1, 2, 3]);
  });

  it('falls back to any format (ffmpeg) when there is no Opus stream', async () => {
    mockGetInfo(
      makeInfo({
        chooseFormat: vi.fn(() => {
          throw new Error('No matching formats found');
        })
      })
    );
    await createYoutubeAudioResource(ID, 100);
    expect(createAudioResource.mock.calls[0][1]).toEqual({ inputType: StreamType.Arbitrary, inlineVolume: true });
  });

  it('tries the next client when the first fails', async () => {
    const getInfo = mockGetInfo(new Error('Video is unplayable'), makeInfo());
    await createYoutubeAudioResource(ID, 100);
    expect(getInfo).toHaveBeenNthCalledWith(2, ID, { client: 'IOS', po_token: undefined });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('tries the next client when the first chunk is rejected', async () => {
    const forbidden = Object.assign(new Error('non 2xx'), { info: { response: { status: 403 } } });
    const failing = makeInfo({
      download: vi.fn(async () => new ReadableStream({ pull: c => c.error(forbidden) }))
    });
    const getInfo = mockGetInfo(failing, makeInfo());
    await createYoutubeAudioResource(ID, 100);
    expect(getInfo).toHaveBeenCalledTimes(2);
  });

  it('maps a 403 on every client to YoutubeBlocked', async () => {
    const forbidden = Object.assign(new Error('non 2xx'), { info: { response: { status: 403 } } });
    mockGetInfo(forbidden, forbidden);
    await expect(createYoutubeAudioResource(ID, 100)).rejects.toThrow('YoutubeBlocked');
  });

  it('reports YoutubeBlocked when any client was blocked, even if the last failed differently', async () => {
    const forbidden = Object.assign(new Error('non 2xx'), { info: { response: { status: 403 } } });
    mockGetInfo(forbidden, new Error('Request failed with status code 400'));
    await expect(createYoutubeAudioResource(ID, 100)).rejects.toThrow('YoutubeBlocked');
  });

  it('logs each failing client', async () => {
    const getInfo = mockGetInfo(new Error('boom'));
    getInfo.mockRejectedValueOnce('plain string failure');
    await expect(createYoutubeAudioResource(ID, 100)).rejects.toThrow('VideoUnavailable');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('MWEB failed'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('IOS failed'));
  });

  it('treats an empty stream as unavailable', async () => {
    mockGetInfo(makeInfo({ download: vi.fn(async () => webStream([])) }), makeInfo({ download: vi.fn(async () => webStream([])) }));
    await expect(createYoutubeAudioResource(ID, 100)).rejects.toThrow('VideoUnavailable');
  });

  it('sends a video-bound PO token and applies it to YTMUSIC stream URLs', async () => {
    const mint = vi.fn(async (binding: string) => `token-for-${binding}`);
    vi.mocked(getPoTokenMinter).mockResolvedValue({ mint, expiresAt: Infinity });
    vi.mocked(getYoutubeStreamClients).mockReturnValue(['MWEB', 'YTMUSIC']);
    const getInfo = mockGetInfo(new Error('blocked'), makeInfo());
    await createYoutubeAudioResource(ID, 100);
    expect(mint).toHaveBeenCalledWith(ID);
    expect(getInfo).toHaveBeenNthCalledWith(2, ID, { client: 'YTMUSIC', po_token: `token-for-${ID}` });
    expect(withStreamPoToken).toHaveBeenCalledTimes(1);
    expect(vi.mocked(withStreamPoToken).mock.calls[0][1]).toBe(`token-for-${ID}`);
  });

  it('keeps the session token for other clients', async () => {
    vi.mocked(getPoTokenMinter).mockResolvedValue({ mint: async () => 'tok', expiresAt: Infinity });
    mockGetInfo(makeInfo());
    await createYoutubeAudioResource(ID, 100);
    expect(withStreamPoToken).not.toHaveBeenCalled();
  });

  it('plays without a token when minting fails', async () => {
    vi.mocked(getPoTokenMinter).mockResolvedValue({
      mint: async () => {
        throw new Error('mint failed');
      },
      expiresAt: Infinity
    });
    const getInfo = mockGetInfo(makeInfo());
    await createYoutubeAudioResource(ID, 100);
    expect(getInfo).toHaveBeenCalledWith(ID, { client: 'MWEB', po_token: undefined });
  });

  it('rejects lives without trying other clients', async () => {
    const getInfo = mockGetInfo(makeInfo({ basic_info: { is_live: true } }));
    await expect(createYoutubeAudioResource(ID, 100)).rejects.toThrow('LiveUnsupported');
    expect(getInfo).toHaveBeenCalledTimes(1);
  });
});
