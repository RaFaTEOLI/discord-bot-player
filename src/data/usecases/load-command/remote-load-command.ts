import { HttpClient, HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { CommandModel } from '@/domain/models/command';
import { LoadCommand } from '@/domain/usecases/load-command';

export class RemoteLoadCommand implements LoadCommand {
  constructor(private readonly url: string, private readonly httpGetClient: HttpClient<CommandModel>) {}

  async load(command: string): Promise<CommandModel> {
    const httpResponse = await this.httpGetClient.request({
      url: this.url,
      method: 'get',
      params: { name: command }
    });
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
