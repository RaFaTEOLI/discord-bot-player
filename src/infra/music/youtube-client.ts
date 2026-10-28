import vm from 'node:vm';
import type { Innertube, Types } from 'youtubei.js';
import { validateYoutubeCookieFormat } from './youtube-cookie-validation';
import { getPoTokenMinter } from './youtube-po-token';

type EvalData = { output: string };
type EvalEnv = Record<string, string | number | boolean | null | undefined>;

const EVAL_TIMEOUT_MS = 5_000;

let clientPromise: Promise<Innertube> | null = null;

export const readYoutubeCookie = (): string =>
  process.env.YOUTUBE_COOKIE?.trim() || process.env.BOT_YOUTUBE_COOKIE?.trim() || '';

/**
 * youtubei.js ships no JavaScript interpreter: deciphering stream URLs needs the extracted
 * player script to run somewhere. The script is a function body ending in `return process(n, sp, sig)`
 * (appended by youtubei.js); it runs in a fresh `vm` context (own globals, timeout) and yields `{ n, sig }`.
 */
const evaluatePlayerScript = (data: EvalData, _env: EvalEnv): Record<string, unknown> => {
  const code = `(function () {\n${data.output}\n})()`;
  return vm.runInNewContext(code, { URL, URLSearchParams }, { timeout: EVAL_TIMEOUT_MS });
};

const createClient = async (): Promise<Innertube> => {
  // ESM-only package: under the CJS build this becomes require(), which Node >= 22.12 supports.
  const { Innertube, Log, Platform, UniversalCache } = await import('youtubei.js');
  Platform.load({ ...Platform.shim, eval: evaluatePlayerScript });
  // The parser warns about every unknown YouTube UI node; only real errors are useful here.
  Log.setLevel(Log.Level.ERROR);

  const raw = readYoutubeCookie();
  const cookie = raw && validateYoutubeCookieFormat(raw).ok ? raw : undefined;
  return await Innertube.create({
    cookie,
    po_token: process.env.YOUTUBE_PO_TOKEN?.trim() || undefined,
    visitor_data: process.env.YOUTUBE_VISITOR_DATA?.trim() || undefined,
    retrieve_player: true,
    cache: new UniversalCache(false)
  });
};

/** Shared Innertube instance, created on first use. A failed creation is retried on the next call. */
export const getYoutubeClient = async (): Promise<Innertube> => {
  if (!clientPromise) {
    clientPromise = createClient().catch(err => {
      clientPromise = null;
      throw err;
    });
  }
  return await clientPromise;
};

/**
 * Ordered InnerTube clients to try for streaming; override with `YOUTUBE_CLIENTS=MWEB,IOS`.
 * App clients (IOS, TV_SIMPLY, ANDROID) answer HTTP 400 to cookie-authenticated requests,
 * so a logged-in session sticks to web-based clients. With generated PO tokens, YTMUSIC (video-bound
 * token) and TV_SIMPLY (visitor-bound token, logged out only) also play videos MWEB is refused.
 */
export const getYoutubeStreamClients = (): Types.InnerTubeClient[] => {
  const fromEnv = process.env.YOUTUBE_CLIENTS?.split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);
  if (fromEnv?.length) return fromEnv as Types.InnerTubeClient[];
  return readYoutubeCookie() ? ['MWEB', 'YTMUSIC'] : ['MWEB', 'YTMUSIC', 'TV_SIMPLY', 'IOS'];
};

/** Logs credential status and warms the client at startup; never throws. */
export const bootstrapYoutubeClient = async (): Promise<void> => {
  const raw = readYoutubeCookie();
  if (!raw) {
    console.info(
      '[youtube] No YOUTUBE_COOKIE set — YouTube playback may fail when Google serves bot/consent pages. Paste browser cookies into YOUTUBE_COOKIE if streams break.'
    );
  } else {
    const format = validateYoutubeCookieFormat(raw);
    if ('reason' in format) {
      console.warn(`[youtube] YOUTUBE_COOKIE ignored — ${format.reason}`);
    }
  }
  try {
    const yt = await getYoutubeClient();
    console.info('[youtube] Innertube client ready.');
    // Runs BotGuard now rather than delaying the first song; failures are logged and retried later.
    await getPoTokenMinter(yt);
  } catch (err) {
    console.warn('[youtube] Could not create Innertube client yet; will retry on first use.', err);
  }
};
