import { DiscordExecuteCommand } from './discord-execute-command';
import { HttpClientSpy, mockRemoteLoadCommandById } from '@/data/test';
import { faker } from '@faker-js/faker';
import { LoadCommandById } from '@/domain/usecases/load-command-by-id';

type SutTypes = {
  sut: DiscordExecuteCommand;
  remoteLoadCommandByIdStub: LoadCommandById;
};

const makeSut = (): SutTypes => {
  const remoteLoadCommandByIdStub = mockRemoteLoadCommandById(faker.internet.url(), new HttpClientSpy());
  const sut = new DiscordExecuteCommand(remoteLoadCommandByIdStub);

  return { sut, remoteLoadCommandByIdStub };
};

describe('Remote Execute Command', () => {
  test('should call LoadCommandById with correct values', async () => {
    const { sut, remoteLoadCommandByIdStub } = makeSut();
    const loadSpy = jest.spyOn(remoteLoadCommandByIdStub, 'loadById');

    await sut.execute('any_id');
    expect(loadSpy).toHaveBeenCalledWith('any_id');
  });
});
