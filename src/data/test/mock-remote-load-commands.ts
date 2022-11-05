import { CommandModel } from '@/domain/models/command';
import { mockCommandData } from '@/domain/test/mock-command';
import { LoadCommands } from '@/domain/usecases/load-commands';
import { HttpClient } from '@/data/protocols/http';

export const mockRemoteLoadCommands = (url: string, httpGetClient: HttpClient<CommandModel[]>): LoadCommands => {
  class RemoteLoadCommandsStub implements LoadCommands {
    constructor(private readonly url: string, private readonly httpGetClient: HttpClient<CommandModel[]>) {}

    async load(): Promise<CommandModel[]> {
      return await Promise.resolve(mockCommandData());
    }
  }
  return new RemoteLoadCommandsStub(url, httpGetClient);
};
