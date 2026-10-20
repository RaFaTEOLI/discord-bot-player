import play from 'play-dl';
import { validateYoutubeCookieFormat } from './youtube-cookie-validation';

/**
 * Registers optional credentials with play-dl.
 * YouTube often requires a logged-in cookie string for reliable `stream` / `stream_from_info`.
 * @see https://github.com/play-dl/play-dl (setToken → youtube.cookie)
 */
export const bootstrapPlayDl = async (): Promise<void> => {
  const cookie =
    process.env.YOUTUBE_COOKIE?.trim() ?? process.env.BOT_YOUTUBE_COOKIE?.trim() ?? '';
  if (!cookie) {
    console.info(
      '[play-dl] No YOUTUBE_COOKIE set — YouTube playback may fail when Google serves bot/consent pages. Paste browser cookies into YOUTUBE_COOKIE if streams break.'
    );
    return;
  }
  const format = validateYoutubeCookieFormat(cookie);
  if (!format.ok) {
    console.warn(`[play-dl] YOUTUBE_COOKIE ignored — ${format.reason}`);
    return;
  }
  await play.setToken({ youtube: { cookie } });
  console.info('[play-dl] YouTube cookie registered from environment.');
};
