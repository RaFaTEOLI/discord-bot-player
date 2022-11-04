import { CommandModel } from '@/domain/models/command';
import { mockCommand } from '@/domain/test/mock-command';
import { LoadCommand } from '@/domain/usecases/load-command';
import { HttpClient } from '@/data/protocols/http';

export const mockRemoteLoadCommand = (url: string, httpGetClient: HttpClient<CommandModel>): LoadCommand => {
  class RemoteLoadCommandStub implements LoadCommand {
    constructor(private readonly url: string, private readonly httpGetClient: HttpClient<CommandModel>) {}

    async load(command: string): Promise<CommandModel> {
      return await Promise.resolve(mockCommand());
    }
  }
  return new RemoteLoadCommandStub(url, httpGetClient);
};
