import { HttpClient, HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { CommandModel } from '@/domain/models/command';
import { LoadCommands } from '@/domain/usecases/load-commands';

export class RemoteLoadCommands implements LoadCommands {
  constructor(private readonly url: string, private readonly httpGetClient: HttpClient<CommandModel[]>) {}

  async load(): Promise<CommandModel[]> {
    const httpResponse = await this.httpGetClient.request({
      url: this.url,
      method: 'get'
    });
    const remoteCommand = httpResponse.body;
    switch (httpResponse.statusCode) {
      case HttpStatusCode.success:
        return remoteCommand;
      case HttpStatusCode.noContent:
        return [];
      case HttpStatusCode.forbidden:
        throw new AccessDeniedError();
      default:
        throw new UnexpectedError();
    }
  }
}
