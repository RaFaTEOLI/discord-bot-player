/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueueClient } from '../protocols/queue';
import { SaveMusicParams } from '@/domain/usecases/save-music';
import { SaveQueueParams } from '@/domain/usecases/save-queue';

export class AmqpClientSpy<R = SaveMusicParams | SaveQueueParams> implements QueueClient<R> {
  async send(queue: 'music' | 'queue', data: R): Promise<void> {
    return await Promise.resolve();
  }
}
