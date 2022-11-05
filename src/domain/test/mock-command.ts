import { CommandModel } from '@/domain/models/command';
import { faker } from '@faker-js/faker';

export const mockCommand = (): CommandModel => ({
  id: 'any_id',
  command: 'any_command',
  dispatcher: 'message',
  type: 'message',
  description: 'any_description',
  response: 'any_response',
  message: 'any_message'
});

export const mockCommandData = (): CommandModel[] => [
  mockCommand(),
  {
    id: faker.datatype.uuid(),
    command: faker.random.word(),
    dispatcher: 'client',
    type: 'music',
    description: faker.random.words(),
    response: faker.internet.url()
  }
];
