import { Song } from 'discord-music-player';

export type SaveQueueParams = {
  songs: Song[];
};

export interface SaveQueue {
  save: (data: SaveQueueParams) => Promise<void>;
}
