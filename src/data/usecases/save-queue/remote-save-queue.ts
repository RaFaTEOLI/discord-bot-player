import { HttpClient, HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { SaveQueue, SaveQueueParams } from '@/domain/usecases/save-queue';
import { AmqpClient } from '@/infra/queue/amqp-client';

export class RemoteSaveQueue implements SaveQueue {
  constructor(
    private readonly url: string,
    private readonly httpGetClient: HttpClient<void>,
    private readonly amqpClient: AmqpClient<SaveQueueParams>,
    private readonly useApiQueue: boolean
  ) {}

  async save(data: SaveQueueParams): Promise<void> {
    if (this.useApiQueue) {
      try {
        await this.amqpClient.send('queue', data);
        return;
      } catch (err) {
        console.error(
          `Error sending music queue payload to API Queue: ${JSON.stringify(data)} with error: ${err.message}`
        );
        return;
      }
    }

    const httpResponse = await this.httpGetClient.request({
      url: this.url,
      method: 'post',
      body: data
    });
    switch (httpResponse.statusCode) {
      case HttpStatusCode.noContent:
        return;
      case HttpStatusCode.forbidden:
        throw new AccessDeniedError();
      default:
        throw new UnexpectedError();
    }
  }
}
