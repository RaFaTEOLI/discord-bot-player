import { ExecuteCommand } from '@/domain/usecases/execute-command';
import { LoadCommandById } from '@/domain/usecases/load-command-by-id';
import { SendMessage } from '@/domain/usecases/send-message';

export class DiscordExecuteCommand implements ExecuteCommand {
  constructor(
    private readonly remoteLoadCommandById: LoadCommandById,
    private readonly sendMessageChannel: SendMessage
  ) {}

  async execute(commandId: string): Promise<void> {
    const command = await this.remoteLoadCommandById.loadById(commandId);
    if (!command) {
      return await this.sendMessageChannel.send({
        title: 'Invalid Command!',
        description: 'The command you tried is invalid!'
      });
    }

    switch (command.type) {
      case 'message':
        return await this.sendMessageChannel.send({
          title: command.response
        });
      default:
        return await this.sendMessageChannel.send({
          title: 'Invalid Command Type!',
          description: 'The command type you tried is invalid!'
        });
    }
  }
}
