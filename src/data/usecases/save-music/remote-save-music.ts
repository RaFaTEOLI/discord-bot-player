import { HttpClient, HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { MusicModel } from '@/domain/models/music';
import { SaveMusic, SaveMusicParams } from '@/domain/usecases/save-music';

export class RemoteSaveMusic implements SaveMusic {
  constructor(private readonly url: string, private readonly httpGetClient: HttpClient<MusicModel>) {}

  async save(data: SaveMusicParams): Promise<void> {
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
