import 'dotenv/config';
import { validateYoutubeCookieFormat } from '../src/infra/music/youtube-cookie-validation';
import { getYoutubeClient, readYoutubeCookie } from '../src/infra/music/youtube-client';
import { createYoutubeAudioResource } from '../src/infra/music/youtube-audio-resource';
import { getPoTokenMinter } from '../src/infra/music/youtube-po-token';

const PROBE_VIDEO_ID = 'jNQXAC9IVRw';
/** A label-owned music video: YouTube refuses these streams without a PO token. */
const MUSIC_VIDEO_ID = 'kJQP7kiw5Fk';

const firstAudio = async (videoId: string): Promise<void> => {
  const resource = await createYoutubeAudioResource(videoId, 100);
  await new Promise<void>((resolve, reject) => {
    resource.playStream.once('readable', resolve);
    resource.playStream.once('error', reject);
  });
  resource.playStream.destroy();
};

void (async (): Promise<void> => {
  const format = validateYoutubeCookieFormat(readYoutubeCookie());
  if (format.ok === false) {
    console.error(`[validate:youtube-cookie] ${format.reason}`);
    process.exit(1);
  }

  try {
    const yt = await getYoutubeClient();
    const info = await yt.getBasicInfo(PROBE_VIDEO_ID);
    console.info(`[validate:youtube-cookie] Metadata OK: "${info.basic_info.title ?? '?'}".`);

    // Exercises format selection + URL deciphering, not just metadata.
    await firstAudio(PROBE_VIDEO_ID);
    console.info('[validate:youtube-cookie] Audio stream OK.');

    const minter = await getPoTokenMinter(yt);
    console.info(`[validate:youtube-cookie] PO token generation: ${minter ? 'working' : 'off or failed'}.`);
    try {
      await firstAudio(MUSIC_VIDEO_ID);
      console.info('[validate:youtube-cookie] Official music video stream OK.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[validate:youtube-cookie] Official music video stream failed (${msg}); these need PO tokens.`);
    }
    process.exit(0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[validate:youtube-cookie] YouTube probe failed:', msg);
    process.exit(1);
  }
})();
