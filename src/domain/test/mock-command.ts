import { CommandModel } from '@/domain/models/command';

export const mockCommand = (): CommandModel => ({
  id: 'any_id',
  command: 'any_command',
  dispatcher: 'any_dispatcher',
  type: 'message',
  description: 'any_description',
  response: 'any_response',
  message: 'any_message'
});