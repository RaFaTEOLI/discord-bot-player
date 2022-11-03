import { HttpClient, HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { CommandModel } from '@/domain/models/command';
import { LoadCommandById } from '@/domain/usecases/load-command-by-id';

export class RemoteLoadCommandById implements LoadCommandById {
  constructor(private readonly url: string, private readonly httpGetClient: HttpClient<CommandModel>) {}

  async loadById(commandId: string): Promise<CommandModel> {
    const httpResponse = await this.httpGetClient.request({ url: `${this.url}/${commandId}`, method: 'get' });
    const remoteCommand = httpResponse.body;
    switch (httpResponse.statusCode) {
      case HttpStatusCode.success:
        return remoteCommand;
      case HttpStatusCode.forbidden:
        throw new AccessDeniedError();
      default:
        throw new UnexpectedError();
    }
  }
}
