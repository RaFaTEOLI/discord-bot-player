import { createAudioResource, StreamType as DjsStreamType } from '@discordjs/voice';
import play from 'play-dl';
import type { Readable } from 'node:stream';

type YoutubeStreamLike = { stream: Readable; type: DjsStreamType | string };

/** play-dl recommends this for Discord pipelines; also avoids some broken format picks. */
const PLAY_DL_STREAM_OPTS = { discordPlayerCompatibility: true } as const;

const normalizeYoutubeUrl = (input: string): string => {
  try {
    const u = new URL(input);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '');
      if (!id) throw new Error('InvalidUrl');
      return `https://www.youtube.com/watch?v=${id}`;
    }
    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/watch?v=${v}`;
      const m = u.pathname.match(/^\/watch\/([^/]+)/)?.[1] ?? u.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
      if (m) return `https://www.youtube.com/watch?v=${m}`;
    }
    return input;
  } catch {
    throw new Error('InvalidUrl');
  }
};

const toResource = (ys: YoutubeStreamLike, volumePercent: number): ReturnType<typeof createAudioResource> => {
  const resource = createAudioResource(ys.stream, {
    inputType: ys.type as DjsStreamType,
    inlineVolume: true
  });
  const vol = Math.min(2, Math.max(0, volumePercent / 100));
  resource.volume?.setVolume(vol);
  return resource;
};

/**
 * YouTube playback: prefer play-dl (with deciphered info + Discord-friendly stream options).
 */
export const createYoutubeAudioResource = async (
  youtubeUrl: string,
  volumePercent: number
): Promise<ReturnType<typeof createAudioResource>> => {
  if (typeof youtubeUrl !== 'string' || !youtubeUrl.trim()) {
    throw new Error('VideoUnavailable');
  }
  const normalized = normalizeYoutubeUrl(youtubeUrl.trim());

  const attempts: Array<() => Promise<YoutubeStreamLike>> = [
    async () => {
      const info = await play.video_info(normalized);
      const raw = await play.stream_from_info(info, PLAY_DL_STREAM_OPTS);
      return raw as YoutubeStreamLike;
    },
    async () => {
      const basic = await play.video_basic_info(normalized);
      const deciphered = await play.decipher_info(basic, true);
      const raw = await play.stream_from_info(deciphered, PLAY_DL_STREAM_OPTS);
      return raw as YoutubeStreamLike;
    },
    async () => {
      const raw = await play.stream(normalized, PLAY_DL_STREAM_OPTS);
      return raw as YoutubeStreamLike;
    }
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const ys = await attempt();
      if (!ys?.stream) {
        throw new Error('NoStream');
      }
      return toResource(ys, volumePercent);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
};
