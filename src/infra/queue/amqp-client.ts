import { QueueClient } from '@/data/protocols/queue';
import { connect } from 'amqplib';
import { SaveMusicParams } from '@/domain/usecases/save-music';
import { SaveQueueParams } from '@/domain/usecases/save-queue';
import 'dotenv/config';

export class AmqpClient<R = SaveMusicParams | SaveQueueParams> implements QueueClient<R> {
  async send(queue: 'music' | 'queue', data: R): Promise<void> {
    const connection = await connect(
      `amqp://${process.env.BOT_API_QUEUE_USERNAME}:${process.env.BOT_API_QUEUE_PASSWORD}@${process.env.BOT_API_QUEUE_ADRESS}:${process.env.BOT_API_QUEUE_PORT}`
    );

    const channel = await connection.createChannel();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  }
}
