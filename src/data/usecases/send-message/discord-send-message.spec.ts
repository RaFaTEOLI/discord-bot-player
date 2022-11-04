import { DiscordSendMessage } from './discord-send-message';
import { EmbedBuilder } from 'discord.js';
import { SendMessageChannel } from '@/data/protocols/discord/send-message-channel';
import { mockEmbedBuilder, mockSendMessageChannel } from '@/data/test';

type SutTypes = {
  sut: DiscordSendMessage;
  sendMessageChannelStub: SendMessageChannel;
  embedBuilderStub: EmbedBuilder;
};

const makeSut = (): SutTypes => {
  const sendMessageChannelStub = mockSendMessageChannel();
  const embedBuilderStub = mockEmbedBuilder();
  const sut = new DiscordSendMessage(sendMessageChannelStub, embedBuilderStub);

  return { sut, sendMessageChannelStub, embedBuilderStub };
};

describe('Discord Send Message', () => {
  test('should call send with correct values', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = jest.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      description: 'any_description'
    });
    expect(sendSpy).toHaveBeenCalledWith({
      embeds: [
        {
          data: {
            author: {
              iconURL: 'https://robohash.org/Test?gravatar=hashed',
              name: 'Test',
              url: 'discord-bot-player.com'
            },
            color: '#0099ff',
            description: 'any_description',
            title: 'any_title',
            url: 'discord-bot-player.com'
          }
        }
      ]
    });
  });

  test('should call send with correct values and fields', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = jest.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      fields: {
        name: 'test',
        value: 'value for test'
      },
      description: 'any_description'
    });
    expect(sendSpy).toHaveBeenCalledWith({
      embeds: [
        {
          data: {
            author: {
              iconURL: 'https://robohash.org/Test?gravatar=hashed',
              name: 'Test',
              url: 'discord-bot-player.com'
            },
            color: '#0099ff',
            description: 'any_description',
            fields: [{ name: 'test', value: 'value for test' }],
            title: 'any_title',
            url: 'discord-bot-player.com'
          }
        }
      ]
    });
  });

  test('should call send with title only', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = jest.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title'
    });
    expect(sendSpy).toHaveBeenCalledWith({
      embeds: [
        {
          data: {
            author: {
              iconURL: 'https://robohash.org/Test?gravatar=hashed',
              name: 'Test',
              url: 'discord-bot-player.com'
            },
            color: '#0099ff',
            description: undefined,
            title: 'any_title',
            url: 'discord-bot-player.com'
          }
        }
      ]
    });
  });

  test('should throw exception if send throws exception', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    jest.spyOn(sendMessageChannelStub, 'send').mockRejectedValueOnce(new Error());

    const promise = sut.send({
      title: 'any_title',
      description: 'any_description'
    });
    await expect(promise).rejects.toThrow();
  });

  test('should call send with correct values and fields when calling twice', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = jest.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      fields: {
        name: 'test',
        value: 'value for test'
      },
      description: 'any_description'
    });
    await sut.send({
      title: 'any_title',
      fields: {
        name: 'another test',
        value: 'another value for test'
      },
      description: 'any_description'
    });
    expect(sendSpy).toHaveBeenCalledWith({
      embeds: [
        {
          data: {
            author: {
              iconURL: 'https://robohash.org/Test?gravatar=hashed',
              name: 'Test',
              url: 'discord-bot-player.com'
            },
            color: '#0099ff',
            description: 'any_description',
            fields: [{ name: 'another test', value: 'another value for test' }],
            title: 'any_title',
            url: 'discord-bot-player.com'
          }
        }
      ]
    });
  });
});
