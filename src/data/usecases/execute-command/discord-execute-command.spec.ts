import { DiscordExecuteCommand } from './discord-execute-command';
import { HttpClientSpy, mockDiscordPlayMusic, mockDiscordSendMessage, mockRemoteLoadCommand } from '@/data/test';
import { faker } from '@faker-js/faker';
import { LoadCommand } from '@/domain/usecases/load-command';
import { SendMessage } from '@/domain/usecases/send-message';
import { mockCommand } from '@/domain/test/mock-command';
import { PlayMusic } from '@/domain/usecases/play-music';

type SutTypes = {
  sut: DiscordExecuteCommand;
  remoteLoadCommandStub: LoadCommand;
  discordSendMessageStub: SendMessage;
  discordPlayMusicStub: PlayMusic;
};

const makeSut = (): SutTypes => {
  const discordSendMessageStub = mockDiscordSendMessage();
  const remoteLoadCommandStub = mockRemoteLoadCommand(faker.internet.url(), new HttpClientSpy());
  const discordPlayMusicStub = mockDiscordPlayMusic();
  const sut = new DiscordExecuteCommand(remoteLoadCommandStub, discordSendMessageStub, discordPlayMusicStub);

  return { sut, remoteLoadCommandStub, discordSendMessageStub, discordPlayMusicStub };
};

describe('DiscordExecuteCommand', () => {
  test('should call LoadCommand with correct values', async () => {
    const { sut, remoteLoadCommandStub } = makeSut();
    const loadSpy = jest.spyOn(remoteLoadCommandStub, 'load');

    const id = faker.datatype.uuid();
    await sut.execute(id);
    expect(loadSpy).toHaveBeenCalledWith(id);
  });

  test('should send invalid command message if LoadCommand returns null', async () => {
    const { sut, remoteLoadCommandStub, discordSendMessageStub } = makeSut();
    jest.spyOn(remoteLoadCommandStub, 'load').mockResolvedValueOnce(null);
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
    const { sut, remoteLoadCommandStub, discordSendMessageStub } = makeSut();
    jest
      .spyOn(remoteLoadCommandStub, 'load')
      .mockResolvedValueOnce(Object.assign({}, mockCommand(), { type: 'invalid' }));
    const sendSpy = jest.spyOn(discordSendMessageStub, 'send');

    await sut.execute(faker.datatype.uuid());
    expect(sendSpy).toHaveBeenCalledWith({
      title: 'Invalid Command Type!',
      description: 'The command type you tried is invalid!'
    });
  });

  test('should call DiscordPlayMusic with correct response if command type is music', async () => {
    const { sut, remoteLoadCommandStub, discordPlayMusicStub } = makeSut();
    const fakeCommand = mockCommand();
    jest
      .spyOn(remoteLoadCommandStub, 'load')
      .mockResolvedValueOnce(Object.assign({}, fakeCommand, { type: 'music' }));
    const playSpy = jest.spyOn(discordPlayMusicStub, 'play');

    await sut.execute(fakeCommand.response);
    expect(playSpy).toHaveBeenCalledWith(fakeCommand.response);
  });
});
