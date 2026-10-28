import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Innertube } from 'youtubei.js';

type PoTokenModule = typeof import('./youtube-po-token');

// The module keeps the minter and backoff in module state; load a fresh copy per test.
const load = async (): Promise<PoTokenModule> => {
  vi.resetModules();
  return await import('./youtube-po-token');
};

describe('youtube-po-token', () => {
  beforeEach(() => {
    delete process.env.YOUTUBE_PO_TOKEN;
    delete process.env.YOUTUBE_PO_TOKEN_GENERATION;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('encodes web-safe base64 with padding kept', async () => {
    const { toWebsafeBase64 } = await load();
    expect(toWebsafeBase64([0xfb, 0xff, 0xbf])).toBe('-_-_');
    expect(toWebsafeBase64([1])).toBe('AQ==');
  });

  it('is enabled by default and disabled by a static token or the flag', async () => {
    const { isPoTokenGenerationEnabled } = await load();
    expect(isPoTokenGenerationEnabled()).toBe(true);
    process.env.YOUTUBE_PO_TOKEN_GENERATION = 'FALSE';
    expect(isPoTokenGenerationEnabled()).toBe(false);
    delete process.env.YOUTUBE_PO_TOKEN_GENERATION;
    process.env.YOUTUBE_PO_TOKEN = 'static';
    expect(isPoTokenGenerationEnabled()).toBe(false);
  });

  it('returns null without touching YouTube when disabled', async () => {
    const { getPoTokenMinter } = await load();
    process.env.YOUTUBE_PO_TOKEN_GENERATION = 'false';
    const getAttestationChallenge = vi.fn();
    await expect(getPoTokenMinter({ getAttestationChallenge } as unknown as Innertube)).resolves.toBeNull();
    expect(getAttestationChallenge).not.toHaveBeenCalled();
  });

  it('backs off after a failed BotGuard run', async () => {
    const { getPoTokenMinter } = await load();
    const getAttestationChallenge = vi.fn(async () => ({ bg_challenge: undefined }));
    const yt = { getAttestationChallenge } as unknown as Innertube;
    await expect(getPoTokenMinter(yt)).resolves.toBeNull();
    await expect(getPoTokenMinter(yt)).resolves.toBeNull();
    expect(getAttestationChallenge).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('sets the stream token only while the callback runs, then restores the session token', async () => {
    const { withStreamPoToken } = await load();
    const player = { po_token: 'session' };
    const yt = { session: { po_token: 'session', player } } as unknown as Innertube;
    const seen = await withStreamPoToken(yt, 'content', async () => player.po_token);
    expect(seen).toBe('content');
    expect(player.po_token).toBe('session');
  });

  it('serializes concurrent stream-token swaps and survives failures', async () => {
    const { withStreamPoToken } = await load();
    const player = { po_token: 'session' as string | undefined };
    const yt = { session: { po_token: 'session', player } } as unknown as Innertube;
    const seen: Array<string | undefined> = [];
    const slow = async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 5));
      seen.push(player.po_token);
    };
    const failing = withStreamPoToken(yt, 'a', async () => {
      await slow();
      throw new Error('boom');
    });
    const ok = withStreamPoToken(yt, 'b', slow);
    await expect(failing).rejects.toThrow('boom');
    await ok;
    expect(seen).toEqual(['a', 'b']);
    expect(player.po_token).toBe('session');
  });

  it('runs the callback directly when there is no player', async () => {
    const { withStreamPoToken } = await load();
    const yt = { session: {} } as unknown as Innertube;
    await expect(withStreamPoToken(yt, 'x', async () => 42)).resolves.toBe(42);
  });
});
