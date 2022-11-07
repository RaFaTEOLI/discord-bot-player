import { Queue } from '../models/queue';

export type SaveQueueParams = {
  songs: Queue | [];
};

export interface SaveQueue {
  save: (data: SaveQueueParams) => Promise<void>;
}
