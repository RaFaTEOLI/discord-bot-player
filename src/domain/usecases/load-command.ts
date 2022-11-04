import { CommandModel } from '@/domain/models/command';

export interface LoadCommand {
  load: (command: string) => Promise<CommandModel>;
}
