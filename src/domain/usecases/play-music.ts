import { Song } from 'discord-music-player';

export interface PlayMusic {
  play: (url: string, playlist?: boolean) => Promise<Song>;
}
