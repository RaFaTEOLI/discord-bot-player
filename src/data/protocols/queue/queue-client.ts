import { SaveMusicParams } from '@/domain/usecases/save-music';
import { SaveQueueParams } from '@/domain/usecases/save-queue';

export interface QueueClient {
  send: (queue: 'music' | 'queue', data: SaveMusicParams | SaveQueueParams) => Promise<void>;
}
