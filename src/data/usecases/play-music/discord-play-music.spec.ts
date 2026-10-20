/* eslint-disable @typescript-eslint/no-floating-promises */
import { faker } from '@faker-js/faker';
import { DiscordPlayMusic } from './discord-play-music';
import { mockDiscordMessage, mockDiscordQueue } from '@/data/test';
import { Message } from 'discord.js';
import type { IGuildMusicQueue } from '@/domain/music/guild-music-queue';
import { describe, test, expect, vi } from 'vitest';
import { mockDiscordChatInputInteraction } from '@/domain/test';

type SutTypes = {
  sut: DiscordPlayMusic;
  discordMessage: Message;
  discordQueue: IGuildMusicQueue;
};

const makeSut = (discordQueue = mockDiscordQueue(), discordMessage = mockDiscordMessage()): SutTypes => {
  const sut = new DiscordPlayMusic(discordQueue, discordMessage);

  return { sut, discordMessage, discordQueue };
};

describe('DiscordPlayMusic', () => {
  test('should call queue.join with voice channel', async () => {
    const { sut, discordMessage, discordQueue } = makeSut();
    const joinSpy = vi.spyOn(discordQueue, 'join');

    const url = faker.internet.url();
    await sut.play(url);
    expect(joinSpy).toHaveBeenCalledWith(discordMessage.member.voice.channel);
  });

  test('should call queue.enqueue with correct url', async () => {
    const { sut, discordQueue } = makeSut();
    const enqueueSpy = vi.spyOn(discordQueue, 'enqueue');

    const url = faker.internet.url();
    await sut.play(url);
    expect(enqueueSpy).toHaveBeenCalledWith(url, { forcePlaylist: false });
  });

  test('should return a result on queue.enqueue success', async () => {
    const { sut } = makeSut();
    const url = faker.internet.url();
    const result = await sut.play(url);
    expect(result).toBeTruthy();
    expect(result.url).toBe(url);
  });

  test('should throw exception if queue throws exception', () => {
    const { sut, discordQueue } = makeSut();
    vi.spyOn(discordQueue, 'join').mockRejectedValueOnce(new Error());
    const promise = sut.play(faker.internet.url());
    expect(promise).rejects.toThrow();
  });

  test('should call queue.enqueue with forcePlaylist when playlist param is true', async () => {
    const { sut, discordQueue } = makeSut();
    const enqueueSpy = vi.spyOn(discordQueue, 'enqueue');

    const url = faker.internet.url();
    await sut.play(url, true);
    expect(enqueueSpy).toHaveBeenCalledWith(url, { forcePlaylist: true });
  });

  test('should return a playlist-shaped result when playlist param is true', async () => {
    const { sut, discordQueue } = makeSut();
    vi.spyOn(discordQueue, 'enqueue').mockResolvedValueOnce({
      url: faker.internet.url(),
      isPlaylist: true,
      firstTitle: 'x',
      trackCount: 2
    });
    const url = faker.internet.url();
    const result = await sut.play(url, true);
    expect(result.isPlaylist).toBe(true);
    expect(result.trackCount).toBe(2);
  });

  test('should call queue.join with a default voice channel when no voice channel is provided', async () => {
    const discordMessageWithoutVoiceChannel = mockDiscordMessage();
    delete discordMessageWithoutVoiceChannel.member.voice.channel;

    const { sut, discordQueue } = makeSut(mockDiscordQueue(), discordMessageWithoutVoiceChannel);
    const joinSpy = vi.spyOn(discordQueue, 'join');
    const arrayFromSpy = vi.spyOn(Array, 'from');
    arrayFromSpy.mockImplementationOnce(() => [1]);

    const url = faker.internet.url();
    await sut.play(url);
    expect(joinSpy).toHaveBeenCalledWith(discordMessageWithoutVoiceChannel.guild.channels.cache[0].id);
  });

  test('should not call queue.join with a default voice channel when no voice channel is found', async () => {
    const discordMessageWithoutVoiceChannel = mockDiscordMessage();
    delete discordMessageWithoutVoiceChannel.member.voice.channel;
    discordMessageWithoutVoiceChannel.guild.channels.cache = [];

    const { sut, discordQueue } = makeSut(mockDiscordQueue(), discordMessageWithoutVoiceChannel);
    const joinSpy = vi.spyOn(discordQueue, 'join');

    await sut.play(faker.internet.url());
    expect(joinSpy).not.toHaveBeenCalled();
  });

  test('should call queue.join when message is ChatInputCommandInteraction', async () => {
    const discordChatInputCommandInteraction = mockDiscordChatInputInteraction();
    vi.spyOn(discordChatInputCommandInteraction, 'guild', 'get').mockReturnValueOnce({
      channels: {
        cache: [{ type: 2, members: { has: () => true } }]
      }
    } as any);
    const { sut, discordQueue } = makeSut(mockDiscordQueue(), discordChatInputCommandInteraction);
    const joinSpy = vi.spyOn(discordQueue, 'join');

    await sut.play(faker.internet.url());
    expect(joinSpy).toHaveBeenCalled();
  });

  test('should still enqueue when ChatInputCommandInteraction has no matching voice channel', async () => {
    const discordChatInputCommandInteraction = mockDiscordChatInputInteraction();
    vi.spyOn(discordChatInputCommandInteraction, 'guild', 'get').mockReturnValueOnce({
      channels: {
        cache: {
          find: () => undefined
        }
      }
    } as any);
    const { sut, discordQueue } = makeSut(mockDiscordQueue(), discordChatInputCommandInteraction);
    const joinSpy = vi.spyOn(discordQueue, 'join');
    const enqueueSpy = vi.spyOn(discordQueue, 'enqueue');

    await sut.play(faker.internet.url());
    expect(joinSpy).not.toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalled();
  });
});
