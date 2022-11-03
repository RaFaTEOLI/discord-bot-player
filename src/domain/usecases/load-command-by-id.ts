import { CommandModel } from '@/domain/models/command';

export interface LoadCommandById {
  loadById: (commandId: string) => Promise<CommandModel>;
}
