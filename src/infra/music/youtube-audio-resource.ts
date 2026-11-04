import { pipeline, Readable, Transform } from 'node:stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { createAudioResource, StreamType } from '@discordjs/voice';
import prism from 'prism-media';
import type { Innertube, Types } from 'youtubei.js';
import { extractYoutubeVideoId } from '@/infra/media-url/classify-playable-url';
import { toYoutubeFailureCode, VIDEO_UNAVAILABLE, YOUTUBE_BLOCKED } from '@/infra/media-url/youtube-failure';
import { getYoutubeClient, getYoutubeStreamClients } from './youtube-client';
import { getPoTokenMinter, withStreamPoToken } from './youtube-po-token';

export const SEEK_UNSUPPORTED = 'SeekUnsupported';

/** WebM/Opus is demuxed here (see `toResource`), so no ffmpeg is needed on the host. */
const OPUS_AUDIO: Types.DownloadOptions = { type: 'audio', quality: 'best', format: 'webm', codec: 'opus' };
/** Any audio container; `StreamType.Arbitrary` makes @discordjs/voice transcode with ffmpeg. */
const ANY_AUDIO: Types.DownloadOptions = { type: 'audio', quality: 'best', format: 'any' };

/**
 * Clients whose stream URLs need the video-bound PO token as `pot` (the session-level token is
 * rejected with 403). Found by live probing; other clients use the session token, if any.
 */
const CONTENT_BOUND_STREAM_CLIENTS = new Set<Types.InnerTubeClient>(['YTMUSIC']);
/** Serves label-owned music with a video-bound token, but refuses many ordinary uploads. */
const MUSIC_CLIENT: Types.InnerTubeClient = 'YTMUSIC';
/** YouTube's Opus audio uses 20 ms frames. */
const OPUS_FRAME_MS = 20;

type AudioResource = ReturnType<typeof createAudioResource>;

export type YoutubeAudioOptions = {
  /** Start this far into the track (WebM/Opus only; otherwise `SeekUnsupported`). */
  startMs?: number;
  /** The track is known to be music (Spotify, YouTube category "Music"): try the music client first. */
  preferMusicClient?: boolean;
};

const openAudioStream = async (
  yt: Innertube,
  videoId: string,
  client: Types.InnerTubeClient,
  contentToken: string | undefined
): Promise<{ stream: Readable; type: StreamType }> => {
  const info = await yt.getInfo(videoId, { client, po_token: contentToken });
  if (info.basic_info.is_live || info.basic_info.is_upcoming) {
    throw new Error('LiveUnsupported');
  }
  let options = OPUS_AUDIO;
  let type = StreamType.WebmOpus;
  try {
    info.chooseFormat(OPUS_AUDIO);
  } catch {
    options = ANY_AUDIO;
    type = StreamType.Arbitrary;
  }
  const web =
    contentToken && CONTENT_BOUND_STREAM_CLIENTS.has(client)
      ? await withStreamPoToken(yt, contentToken, async () => await info.download(options))
      : await info.download(options);
  return { stream: await primeStream(web as unknown as NodeWebReadableStream<Uint8Array>), type };
};

/**
 * Reads the first chunk before handing the stream over: YouTube rejects some clients only when
 * media bytes are requested (HTTP 403), and that must surface here so the next client is tried.
 */
const primeStream = async (web: NodeWebReadableStream<Uint8Array>): Promise<Readable> => {
  const reader = web.getReader();
  const first = await reader.read();
  if (first.done || !first.value?.length) {
    reader.releaseLock();
    throw new Error('EmptyStream');
  }
  async function * chunks (): AsyncGenerator<Uint8Array> {
    yield first.value;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      // Stops the underlying download when playback is skipped or stopped early.
      void reader.cancel().catch(() => undefined);
    }
  }
  return Readable.from(chunks(), { objectMode: false });
};

/** Drops the first `count` Opus packets, which is how a start offset is applied without ffmpeg. */
const skipOpusPackets = (count: number): Transform => {
  let remaining = count;
  return new Transform({
    objectMode: true,
    transform (packet, _encoding, callback) {
      if (remaining > 0) {
        remaining--;
        callback();
      } else {
        callback(null, packet);
      }
    }
  });
};

/**
 * WebM/Opus is demuxed here and handed over as raw Opus packets: given `WebmOpus` plus inline
 * volume, @discordjs/voice prefers an ffmpeg route, while from `Opus` it can only use the
 * opus decoder → volume → encoder pipeline, which needs no ffmpeg.
 */
const toResource = (stream: Readable, type: StreamType, volumePercent: number, startMs: number): AudioResource => {
  let input: Readable = stream;
  let inputType = type;
  if (type === StreamType.WebmOpus) {
    const stages: NodeJS.ReadWriteStream[] = [new prism.opus.WebmDemuxer()];
    if (startMs > 0) stages.push(skipOpusPackets(Math.floor(startMs / OPUS_FRAME_MS)));
    // pipeline() forwards a download error to the last stream, where the AudioPlayer sees it.
    input = pipeline([stream, ...stages], () => undefined) as unknown as Readable;
    inputType = StreamType.Opus;
  } else if (startMs > 0) {
    stream.destroy();
    throw new Error(SEEK_UNSUPPORTED);
  }
  const resource = createAudioResource(input, { inputType, inlineVolume: true });
  resource.volume?.setVolume(Math.min(2, Math.max(0, volumePercent / 100)));
  return resource;
};

const orderClients = (clients: Types.InnerTubeClient[], preferMusicClient: boolean): Types.InnerTubeClient[] =>
  preferMusicClient && clients.includes(MUSIC_CLIENT)
    ? [MUSIC_CLIENT, ...clients.filter(c => c !== MUSIC_CLIENT)]
    : clients;

/**
 * Opens a YouTube audio stream, trying each configured InnerTube client in order
 * (which clients YouTube serves playable formats to changes over time).
 */
export const createYoutubeAudioResource = async (
  youtubeUrl: string,
  volumePercent: number,
  options: YoutubeAudioOptions = {}
): Promise<AudioResource> => {
  const videoId = typeof youtubeUrl === 'string' ? extractYoutubeVideoId(youtubeUrl) : null;
  if (!videoId) {
    throw new Error(VIDEO_UNAVAILABLE);
  }

  const yt = await getYoutubeClient();
  const minter = await getPoTokenMinter(yt);
  const contentToken = minter ? await minter.mint(videoId).catch(() => undefined) : undefined;

  // The music client only helps when it can send a video-bound token.
  const clients = orderClients(getYoutubeStreamClients(), Boolean(options.preferMusicClient && contentToken));
  const failures: Array<{ client: string; code: string; message: string }> = [];
  for (const client of clients) {
    try {
      const { stream, type } = await openAudioStream(yt, videoId, client, contentToken);
      return toResource(stream, type, volumePercent, options.startMs ?? 0);
    } catch (err) {
      if (err instanceof Error && (err.message === 'LiveUnsupported' || err.message === SEEK_UNSUPPORTED)) throw err;
      failures.push({ client, code: toYoutubeFailureCode(err), message: err instanceof Error ? err.message : String(err) });
    }
  }
  // Falling back between clients is routine; only log the reasons when every client failed.
  for (const f of failures) {
    console.warn(`[youtube] ${f.client} failed for ${videoId} (${f.code}): ${f.message}`);
  }
  // One client being blocked is the actionable signal (cookie / PO token), even if others failed differently.
  throw new Error(failures.some(f => f.code === YOUTUBE_BLOCKED) ? YOUTUBE_BLOCKED : VIDEO_UNAVAILABLE);
};
