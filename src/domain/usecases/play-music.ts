import { Playlist, Song } from '@rafateoli/discord-music-player';

export interface PlayMusic {
  play: (url: string, playlist?: boolean) => Promise<Song | Playlist>;
}
