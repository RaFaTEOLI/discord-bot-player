import { QueueClient } from '@/data/protocols/queue';
import { connect } from 'amqplib';
import 'dotenv/config';

export class AmqpClient<R> implements QueueClient<R> {
  async send(queue: 'music' | 'queue', data: R): Promise<void> {
    const connection = await connect(
      `amqp://${process.env.AMQP_USERNAME}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_ADRESS}:${process.env.AMQP_PORT}`
    );

    const channel = await connection.createChannel();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  }
}
