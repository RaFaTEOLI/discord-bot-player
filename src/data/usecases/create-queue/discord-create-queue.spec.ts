import { DiscordCreateQueue } from './discord-create-queue';
import { mockDiscordClient, mockDiscordMessage } from '@/data/test';
import { DiscordClient } from '@/domain/models/discord-client';
import { Message } from 'discord.js';

type SutTypes = {
  sut: DiscordCreateQueue;
  discordMessage: Message;
  discordClientStub: DiscordClient;
};

const makeSut = (): SutTypes => {
  const discordClientStub = mockDiscordClient();
  const discordMessage = mockDiscordMessage();
  const sut = new DiscordCreateQueue(discordClientStub, discordMessage);

  return { sut, discordMessage, discordClientStub };
};

describe('DiscordCreateQueue', () => {
  test('should call client.player.createQueue with message guild id', async () => {
    const { sut, discordMessage, discordClientStub } = makeSut();
    const createQueueSpy = jest.spyOn(discordClientStub.player, 'createQueue');

    sut.createQueue(discordMessage.guild.id);
    expect(createQueueSpy).toHaveBeenCalledWith(discordMessage.guild.id);
  });

  test('should return queue on client.player.createQueue success', async () => {
    const { sut, discordMessage } = makeSut();

    const queue = sut.createQueue(discordMessage.guild.id);
    expect(queue).toEqual({});
  });
});
