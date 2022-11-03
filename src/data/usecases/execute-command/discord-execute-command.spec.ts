import { DiscordExecuteCommand } from './discord-execute-command';
import { HttpClientSpy, mockDiscordSendMessage, mockRemoteLoadCommandById } from '@/data/test';
import { faker } from '@faker-js/faker';
import { LoadCommandById } from '@/domain/usecases/load-command-by-id';
import { SendMessage } from '@/domain/usecases/send-message';
import { mockCommand } from '@/domain/test/mock-command';

type SutTypes = {
  sut: DiscordExecuteCommand;
  remoteLoadCommandByIdStub: LoadCommandById;
  discordSendMessageStub: SendMessage;
};

const makeSut = (): SutTypes => {
  const discordSendMessageStub = mockDiscordSendMessage();
  const remoteLoadCommandByIdStub = mockRemoteLoadCommandById(faker.internet.url(), new HttpClientSpy());
  const sut = new DiscordExecuteCommand(remoteLoadCommandByIdStub, discordSendMessageStub);

  return { sut, remoteLoadCommandByIdStub, discordSendMessageStub };
};

describe('DiscordExecuteCommand', () => {
  test('should call LoadCommandById with correct values', async () => {
    const { sut, remoteLoadCommandByIdStub } = makeSut();
    const loadSpy = jest.spyOn(remoteLoadCommandByIdStub, 'loadById');

    const id = faker.datatype.uuid();
    await sut.execute(id);
    expect(loadSpy).toHaveBeenCalledWith(id);
  });

  test('should send invalid command message if LoadCommandById returns null', async () => {
    const { sut, remoteLoadCommandByIdStub, discordSendMessageStub } = makeSut();
    jest.spyOn(remoteLoadCommandByIdStub, 'loadById').mockResolvedValueOnce(null);
    const sendSpy = jest.spyOn(discordSendMessageStub, 'send');

    await sut.execute(faker.datatype.uuid());
    expect(sendSpy).toHaveBeenCalledWith({
      title: 'Invalid Command!',
      description: 'The command you tried is invalid!'
    });
  });

  test('should send message if command type is message', async () => {
    const { sut, discordSendMessageStub } = makeSut();
    const sendSpy = jest.spyOn(discordSendMessageStub, 'send');

    await sut.execute(faker.datatype.uuid());
    expect(sendSpy).toHaveBeenCalledWith({
      title: 'any_response'
    });
  });

  test('should send invalid command type if command type is invalid', async () => {
    const { sut, remoteLoadCommandByIdStub, discordSendMessageStub } = makeSut();
    jest
      .spyOn(remoteLoadCommandByIdStub, 'loadById')
      .mockResolvedValueOnce(Object.assign({}, mockCommand(), { type: 'invalid' }));
    const sendSpy = jest.spyOn(discordSendMessageStub, 'send');

    await sut.execute(faker.datatype.uuid());
    expect(sendSpy).toHaveBeenCalledWith({
      title: 'Invalid Command Type!',
      description: 'The command type you tried is invalid!'
    });
  });
});