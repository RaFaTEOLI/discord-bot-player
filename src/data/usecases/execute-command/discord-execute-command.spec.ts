import { DiscordExecuteCommand } from './discord-execute-command';
import { HttpClientSpy, mockDiscordPlayMusic, mockDiscordSendMessage, mockRemoteLoadCommand } from '@/data/test';
import { faker } from '@faker-js/faker';
import { LoadCommand } from '@/domain/usecases/load-command';
import { SendMessage } from '@/domain/usecases/send-message';
import { mockCommand, mockCommandData } from '@/domain/test/mock-command';
import { PlayMusic } from '@/domain/usecases/play-music';
import { mockRemoteLoadCommands } from '@/data/test/mock-remote-load-commands';
import { LoadCommands } from '@/domain/usecases/load-commands';
import { CommandModel } from '@/domain/models/command';
import { mockPlayerModel } from '@/domain/test/mock-player';
import { PlayerModel } from '@/domain/models/player';

type SutTypes = {
  sut: DiscordExecuteCommand;
  remoteLoadCommandStub: LoadCommand;
  discordSendMessageStub: SendMessage;
  discordPlayMusicStub: PlayMusic;
  player: PlayerModel;
  remoteLoadCommandsStub: LoadCommands;
  fakeCommands: CommandModel[];
};

const makeSut = (): SutTypes => {
  const discordSendMessageStub = mockDiscordSendMessage();
  const remoteLoadCommandStub = mockRemoteLoadCommand(faker.internet.url(), new HttpClientSpy());
  const discordPlayMusicStub = mockDiscordPlayMusic();
  const player = mockPlayerModel();
  const fakeCommands = mockCommandData();
  const remoteLoadCommandsStub = mockRemoteLoadCommands(faker.internet.url(), new HttpClientSpy(), fakeCommands);
  const sut = new DiscordExecuteCommand(
    remoteLoadCommandStub,
    discordSendMessageStub,
    discordPlayMusicStub,
    player,
    remoteLoadCommandsStub
  );

  return {
    sut,
    remoteLoadCommandStub,
    discordSendMessageStub,
    discordPlayMusicStub,
    player,
    remoteLoadCommandsStub,
    fakeCommands
  };
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
    expect(playSpy).toHaveBeenCalledWith(fakeCommand.response, true);
  });

  test('should call LoadCommands if command is bot name', async () => {
    const { sut, remoteLoadCommandsStub } = makeSut();
    const loadCommandsSpy = jest.spyOn(remoteLoadCommandsStub, 'load');

    await sut.execute('test');
    expect(loadCommandsSpy).toHaveBeenCalled();
  });

  test('should send message with list of commands if command is bot name', async () => {
    const { sut, player, discordSendMessageStub } = makeSut();
    const sendSpy = jest.spyOn(discordSendMessageStub, 'send');

    await sut.execute('test');
    expect(sendSpy).toHaveBeenCalledWith({
      title: player.bot.description,
      fields: [{ name: `${player.prefix}any_command`, value: 'any_description' }]
    });
  });

  test('should send message with list of playlists if command is showPlaylists', async () => {
    const { sut, player, discordSendMessageStub, fakeCommands } = makeSut();
    const sendSpy = jest.spyOn(discordSendMessageStub, 'send');

    await sut.execute('showPlaylists');
    expect(sendSpy).toHaveBeenCalledWith({
      title: '📀  Playlists',
      fields: [{ name: `${player.prefix}${fakeCommands[1].command}`, value: fakeCommands[1].description }]
    });
  });

  test('should send not found message if RemoteLoadCommands returns empty array', async () => {
    const { sut, discordSendMessageStub, remoteLoadCommandsStub } = makeSut();
    jest.spyOn(remoteLoadCommandsStub, 'load').mockResolvedValueOnce([]);
    const sendSpy = jest.spyOn(discordSendMessageStub, 'send');

    await sut.execute('showPlaylists');
    expect(sendSpy).toHaveBeenCalledWith({
      title: '📀  Playlists',
      fields: [{ name: 'Message', value: 'Nothing found!' }]
    });
  });
});
