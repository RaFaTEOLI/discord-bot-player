import { faker } from '@faker-js/faker';
import { DiscordPlayMusic } from './discord-play-music';
import { mockDiscordMessage, mockDiscordQueue } from '@/data/test';
import { Message } from 'discord.js';
import { Queue } from 'discord-music-player';

type SutTypes = {
  sut: DiscordPlayMusic;
  discordMessage: Message;
  discordQueue: Queue;
};

const makeSut = (): SutTypes => {
  const discordQueue = mockDiscordQueue();
  const discordMessage = mockDiscordMessage();
  const sut = new DiscordPlayMusic(discordQueue, discordMessage);

  return { sut, discordMessage, discordQueue };
};

describe('DiscordPlayMusic', () => {
  test('should call queue.join with voice channel', async () => {
    const { sut, discordMessage, discordQueue } = makeSut();
    const joinSpy = jest.spyOn(discordQueue, 'join');

    const url = faker.internet.url();
    await sut.play(url);
    expect(joinSpy).toHaveBeenCalledWith(discordMessage.member.voice.channel);
  });
});
