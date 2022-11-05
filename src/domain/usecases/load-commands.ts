import { CommandModel } from '@/domain/models/command';

export interface LoadCommands {
  load: (command: string) => Promise<CommandModel[]>;
}
