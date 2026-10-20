import 'dotenv/config';
import play from 'play-dl';
import { validateYoutubeCookieFormat } from '../src/infra/music/youtube-cookie-validation';

void (async (): Promise<void> => {
  const cookie =
    process.env.YOUTUBE_COOKIE?.trim() ?? process.env.BOT_YOUTUBE_COOKIE?.trim() ?? '';

  const format = validateYoutubeCookieFormat(cookie);
  if (format.ok === false) {
    console.error(`[validate:youtube-cookie] ${format.reason}`);
    process.exit(1);
  }

  await play.setToken({ youtube: { cookie } });

  const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  try {
    await play.video_basic_info(testUrl);
    console.info('[validate:youtube-cookie] Format OK; play-dl video_basic_info succeeded.');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[validate:youtube-cookie] play-dl failed after setToken:', msg);
    process.exit(1);
  }
})();
