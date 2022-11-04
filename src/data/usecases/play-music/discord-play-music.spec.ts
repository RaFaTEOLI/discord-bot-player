/* eslint-disable @typescript-eslint/no-floating-promises */
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

  test('should call queue.play with correct url', async () => {
    const { sut, discordQueue } = makeSut();
    const playSpy = jest.spyOn(discordQueue, 'play');

    const url = faker.internet.url();
    await sut.play(url);
    expect(playSpy).toHaveBeenCalledWith(url);
  });

  test('should return a song on queue.play success', async () => {
    const { sut } = makeSut();
    const url = faker.internet.url();
    const song = await sut.play(url);
    expect(song).toBeTruthy();
    expect(song.url).toBe(url);
  });

  test('should throw exception if queue throws exception', () => {
    const { sut, discordQueue } = makeSut();
    jest.spyOn(discordQueue, 'join').mockRejectedValueOnce(new Error());
    const promise = sut.play(faker.internet.url());
    expect(promise).rejects.toThrow();
  });
});
