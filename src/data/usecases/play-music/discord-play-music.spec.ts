import { faker } from '@faker-js/faker';
import { DiscordPlayMusic } from './discord-play-music';
import { mockDiscordClient, mockDiscordMessage } from '@/data/test';
import { DiscordClient } from '@/domain/models/discord-client';
import { Message } from 'discord.js';

type SutTypes = {
  sut: DiscordPlayMusic;
  discordMessage: Message;
  discordClientStub: DiscordClient;
};

const makeSut = (): SutTypes => {
  const discordClientStub = mockDiscordClient();
  const discordMessage = mockDiscordMessage();
  const sut = new DiscordPlayMusic(discordClientStub, discordMessage);

  return { sut, discordMessage, discordClientStub };
};

describe('DiscordPlayMusic', () => {
  test('should call client.player.createQueue with message guild id', async () => {
    const { sut, discordMessage, discordClientStub } = makeSut();
    const createQueueSpy = jest.spyOn(discordClientStub.player, 'createQueue');

    const url = faker.internet.url();
    await sut.play(url);
    expect(createQueueSpy).toHaveBeenCalledWith(discordMessage.guild.id);
  });
});
