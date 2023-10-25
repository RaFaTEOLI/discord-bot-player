/* eslint-disable @typescript-eslint/no-floating-promises */
import { faker } from '@faker-js/faker';
import { DiscordPlayMusic } from './discord-play-music';
import { mockDiscordMessage, mockDiscordQueue } from '@/data/test';
import { Message } from 'discord.js';
import { Playlist, Queue } from '@rafateoli/discord-music-player';
import { describe, test, expect, vi } from 'vitest';

type SutTypes = {
  sut: DiscordPlayMusic;
  discordMessage: Message;
  discordQueue: Queue;
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

  test('should call queue.play with correct url', async () => {
    const { sut, discordQueue } = makeSut();
    const playSpy = vi.spyOn(discordQueue, 'play');

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
    vi.spyOn(discordQueue, 'join').mockRejectedValueOnce(new Error());
    const promise = sut.play(faker.internet.url());
    expect(promise).rejects.toThrow();
  });

  test('should call queue.playlist with correct url if playlist param is true', async () => {
    const { sut, discordQueue } = makeSut();
    const playlistSpy = vi.spyOn(discordQueue, 'playlist');

    const url = faker.internet.url();
    await sut.play(url, true);
    expect(playlistSpy).toHaveBeenCalledWith(url);
  });

  test('should return a playlist on queue.playlist success if playlist param is true', async () => {
    const { sut } = makeSut();
    const url = faker.internet.url();
    const playlist = (await sut.play(url, true)) as Playlist;
    expect(playlist).toBeTruthy();
    expect(playlist.url).toBe(url);
    expect(playlist.songs.length).toBe(2);
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
});
