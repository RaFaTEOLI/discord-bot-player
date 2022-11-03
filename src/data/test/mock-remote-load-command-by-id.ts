import { CommandModel } from '@/domain/models/command';
import { mockCommand } from '@/domain/test/mock-command';
import { LoadCommandById } from '@/domain/usecases/load-command-by-id';
import { HttpClient } from '@/data/protocols/http';

export const mockRemoteLoadCommandById = (
  url: string,
  httpGetClient: HttpClient<CommandModel>
): LoadCommandById => {
  class RemoteLoadCommandByIdStub implements LoadCommandById {
    constructor(private readonly url: string, private readonly httpGetClient: HttpClient<CommandModel>) {}

    async loadById(commandId: string): Promise<CommandModel> {
      return await Promise.resolve(mockCommand());
    }
  }
  return new RemoteLoadCommandByIdStub(url, httpGetClient);
};
