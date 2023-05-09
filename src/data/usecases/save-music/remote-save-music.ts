import { HttpClient, HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { MusicModel } from '@/domain/models/music';
import { SaveMusic, SaveMusicParams } from '@/domain/usecases/save-music';
import { AmqpClient } from '@/infra/queue/amqp-client';

export class RemoteSaveMusic implements SaveMusic {
  constructor(
    private readonly url: string,
    private readonly httpGetClient: HttpClient<MusicModel>,
    private readonly amqpClient: AmqpClient<MusicModel>,
    private readonly useApiQueue: boolean
  ) {}

  async save(data: SaveMusicParams): Promise<void> {
    if (this.useApiQueue) {
      await this.amqpClient.send('music', data);
      return;
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
