import { HttpClient, HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { SaveQueue, SaveQueueParams } from '@/domain/usecases/save-queue';

export class RemoteSaveQueue implements SaveQueue {
  constructor(private readonly url: string, private readonly httpGetClient: HttpClient<void>) {}

  async save(data: SaveQueueParams): Promise<void> {
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
