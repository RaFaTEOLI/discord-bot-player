import type { Innertube } from 'youtubei.js';

/** Request key YouTube's web player uses for its WAA integrity token. */
const WAA_REQUEST_KEY = 'O43z0dpjhgX20SCx4KAo';
/** Refresh this long before the integrity token's advertised expiry. */
const EXPIRY_MARGIN_MS = 10 * 60_000;
/** After a failed BotGuard run, wait before trying again instead of retrying on every song. */
const RETRY_AFTER_FAILURE_MS = 5 * 60_000;

export interface PoTokenMinter {
  /** Mints a web-safe PO token bound to a video id or visitor id. */
  mint: (contentBinding: string) => Promise<string>;
  expiresAt: number;
}

type WindowRealm = { Uint8Array: Uint8ArrayConstructor; close: () => void };
type MintCallback = (binding: Uint8Array) => Promise<ArrayLike<number> | undefined>;

let minterPromise: Promise<PoTokenMinter> | null = null;
let retryAfter = 0;
let activeWindow: WindowRealm | null = null;

/** Generation runs unless disabled, or a static `YOUTUBE_PO_TOKEN` is configured. */
export const isPoTokenGenerationEnabled = (): boolean =>
  process.env.YOUTUBE_PO_TOKEN_GENERATION?.trim().toLowerCase() !== 'false' && !process.env.YOUTUBE_PO_TOKEN?.trim();

/** Same encoding as bgutils-js `u8ToBase64(bytes, true)`: base64 with `-_`, padding kept. */
export const toWebsafeBase64 = (bytes: ArrayLike<number>): string =>
  Buffer.from(Uint8Array.from(bytes)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

/**
 * Runs YouTube's BotGuard challenge and returns a WebPO minter.
 *
 * BotGuard runs inside a jsdom window (`runScripts: 'outside-only'`) so the bot's own globals are
 * never replaced by a fake `window`/`document`. Values coming back from that window belong to a
 * different JS realm, so bgutils-js `WebPoMinter` (which uses `instanceof Function/Uint8Array`)
 * can't be used; minting is done here with `typeof` checks and window-realm byte arrays.
 */
const createMinter = async (yt: Innertube): Promise<PoTokenMinter> => {
  const { JSDOM, VirtualConsole } = await import('jsdom');
  const { BotGuardClient } = await import('bgutils-js/botguard');
  const { buildURL, GOOG_API_KEY, USER_AGENT } = await import('bgutils-js/utils');

  const challenge = (await yt.getAttestationChallenge('ENGAGEMENT_TYPE_UNBOUND')).bg_challenge;
  const interpreterUrl = challenge?.interpreter_url.private_do_not_access_or_else_trusted_resource_url_wrapped_value;
  if (!challenge || !interpreterUrl) {
    throw new Error('PoToken: no BotGuard challenge returned');
  }
  const interpreterJs = await (await fetch(`https:${interpreterUrl}`)).text();

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'https://www.youtube.com/',
    referrer: 'https://www.youtube.com/',
    userAgent: USER_AGENT,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    // Drops jsdom's "not implemented" noise (canvas etc.) that BotGuard's probing triggers.
    virtualConsole: new VirtualConsole()
  });
  const win = dom.window as unknown as WindowRealm & { eval: (code: string) => unknown };
  try {
    win.eval(interpreterJs);
    const botguard = await BotGuardClient.create({
      program: challenge.program,
      globalName: challenge.global_name,
      globalObject: dom.window
    });
    const webPoSignalOutput: unknown[] = [];
    const botguardResponse = await botguard.snapshot({ webPoSignalOutput: webPoSignalOutput as never });

    const res = await fetch(buildURL('GenerateIT', true), {
      method: 'POST',
      headers: {
        'content-type': 'application/json+protobuf',
        'x-goog-api-key': GOOG_API_KEY,
        'x-user-agent': 'grpc-web-javascript/0.1',
        'user-agent': USER_AGENT
      },
      body: JSON.stringify([WAA_REQUEST_KEY, botguardResponse])
    });
    if (!res.ok) throw new Error(`PoToken: GenerateIT failed with ${res.status}`);
    const [integrityToken, ttlSecs] = (await res.json()) as [unknown, unknown];
    if (typeof integrityToken !== 'string') throw new Error('PoToken: no integrity token');

    const getMinter = webPoSignalOutput[0];
    if (typeof getMinter !== 'function') throw new Error('PoToken: BotGuard returned no minter');
    const mintCallback: unknown = await getMinter(win.Uint8Array.from(Buffer.from(integrityToken, 'base64')));
    if (typeof mintCallback !== 'function') throw new Error('PoToken: minter initialisation failed');

    const mint = async (binding: string): Promise<string> => {
      const out = await (mintCallback as MintCallback)(win.Uint8Array.from(Buffer.from(binding, 'utf8')));
      if (!out || typeof out.length !== 'number' || out.length === 0) throw new Error('PoToken: mint failed');
      return toWebsafeBase64(out);
    };
    const ttlMs = (typeof ttlSecs === 'number' && ttlSecs > 0 ? ttlSecs : 3600) * 1000;
    activeWindow?.close();
    activeWindow = win;
    return { mint, expiresAt: Date.now() + Math.max(ttlMs - EXPIRY_MARGIN_MS, ttlMs / 2) };
  } catch (err) {
    win.close();
    throw err;
  }
};

/**
 * Logged-out sessions also get a visitor-bound token at session level: youtubei.js uses it for the
 * player request and the `pot` parameter of stream URLs (needed by e.g. the TV_SIMPLY client).
 */
const applySessionToken = async (yt: Innertube, minter: PoTokenMinter): Promise<void> => {
  const visitorData = yt.session.context.client.visitorData;
  if (yt.session.logged_in || !visitorData) return;
  const token = await minter.mint(visitorData);
  yt.session.po_token = token;
  if (yt.session.player) yt.session.player.po_token = token;
};

/**
 * Shared minter, created on first use and renewed when its integrity token is close to expiring.
 * Returns null when generation is disabled or BotGuard failed recently (playback then proceeds
 * without tokens, as before).
 */
export const getPoTokenMinter = async (yt: Innertube): Promise<PoTokenMinter | null> => {
  if (!isPoTokenGenerationEnabled() || Date.now() < retryAfter) return null;
  const existing = minterPromise;
  if (existing) {
    // A failed creation returns null here; its creator handles the backoff.
    const current = await existing.catch(() => null);
    if (!current || Date.now() < current.expiresAt) return current;
    // Expired: only the first caller to notice replaces it.
    if (minterPromise === existing) minterPromise = null;
    if (minterPromise) return await getPoTokenMinter(yt);
  }
  const started = Date.now();
  const created = createMinter(yt).then(async minter => {
    await applySessionToken(yt, minter);
    console.info(`[youtube] PO token minter ready in ${Date.now() - started} ms.`);
    return minter;
  });
  minterPromise = created;
  try {
    return await created;
  } catch (err) {
    if (minterPromise === created) minterPromise = null;
    retryAfter = Date.now() + RETRY_AFTER_FAILURE_MS;
    console.warn('[youtube] PO token generation failed; continuing without tokens for now.', err);
    return null;
  }
};

let playerTokenLock: Promise<unknown> = Promise.resolve();

/**
 * Runs `fn` while stream URLs are deciphered with `token` as their `pot` parameter.
 * youtubei.js reads it from the shared Player, so calls are serialized and the session token is
 * restored afterwards. `download()` deciphers before returning, so the lock is held only briefly.
 */
export const withStreamPoToken = async <T>(yt: Innertube, token: string, fn: () => Promise<T>): Promise<T> => {
  const run = playerTokenLock.then(async () => {
    const player = yt.session.player;
    if (!player) return await fn();
    player.po_token = token;
    try {
      return await fn();
    } finally {
      player.po_token = yt.session.po_token;
    }
  });
  playerTokenLock = run.catch(() => undefined);
  return await run;
};
