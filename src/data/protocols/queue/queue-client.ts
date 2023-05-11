import { SaveMusicParams } from '@/domain/usecases/save-music';
import { SaveQueueParams } from '@/domain/usecases/save-queue';

export interface QueueClient<R = SaveMusicParams | SaveQueueParams> {
  send: (queue: 'music' | 'queue', data: R) => Promise<void>;
}
