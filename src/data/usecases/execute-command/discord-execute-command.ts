import { ExecuteCommand } from '@/domain/usecases/execute-command';
import { LoadCommandById } from '@/domain/usecases/load-command-by-id';

export class DiscordExecuteCommand implements ExecuteCommand {
  constructor(private readonly remoteLoadCommandById: LoadCommandById) {}

  async execute(commandId: string): Promise<void> {
    await this.remoteLoadCommandById.loadById(commandId);
    return null;
  }
}
