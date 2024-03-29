import { DiscordSendMessage } from './discord-send-message';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { SendMessageChannel } from '@/data/protocols/discord/send-message-channel';
import { mockActionRowBuilder, mockButtonBuilder, mockEmbedBuilder, mockSendMessageChannel } from '@/data/test';
import { describe, test, expect, vi } from 'vitest';

type SutTypes = {
  sut: DiscordSendMessage;
  sendMessageChannelStub: SendMessageChannel;
  embedBuilderStub: EmbedBuilder;
  buttonBuilderStub: () => ButtonBuilder;
  actionRowBuilderStub: ActionRowBuilder<ButtonBuilder>;
};

const makeSut = (): SutTypes => {
  const sendMessageChannelStub = mockSendMessageChannel();
  const embedBuilderStub = mockEmbedBuilder();
  const buttonBuilderStub = mockButtonBuilder;
  const actionRowBuilderStub = mockActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;
  const sut = new DiscordSendMessage(
    sendMessageChannelStub,
    embedBuilderStub,
    buttonBuilderStub,
    actionRowBuilderStub
  );

  return { sut, sendMessageChannelStub, embedBuilderStub, buttonBuilderStub, actionRowBuilderStub };
};

describe('Discord Send Message', () => {
  test('should call send with correct values', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

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
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

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
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

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
    vi.spyOn(sendMessageChannelStub, 'send').mockRejectedValueOnce(new Error());

    const promise = sut.send({
      title: 'any_title',
      description: 'any_description'
    });
    await expect(promise).rejects.toThrow();
  });

  test('should call send with correct values and fields when calling twice', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

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

  test('should call send with correct values and array of fields', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      fields: [
        {
          name: 'test',
          value: 'value for test'
        },
        {
          name: 'test 2',
          value: 'value for test 2'
        }
      ],
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
            fields: [
              {
                name: 'test',
                value: 'value for test'
              },
              {
                name: 'test 2',
                value: 'value for test 2'
              }
            ],
            title: 'any_title',
            url: 'discord-bot-player.com'
          }
        }
      ]
    });
  });

  test('should call send with correct values, with array of fields and components', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      fields: [
        {
          name: 'test',
          value: 'value for test'
        },
        {
          name: 'test 2',
          value: 'value for test 2'
        }
      ],
      buttons: [{ label: 'test label', customId: 'testId', style: ButtonStyle.Primary }],
      description: 'any_description'
    });

    const calledWith = JSON.parse(JSON.stringify(sendSpy.mock.calls[0][0]));

    expect(calledWith).toEqual({
      embeds: [
        {
          author: {
            iconURL: 'https://robohash.org/Test?gravatar=hashed',
            name: 'Test',
            url: 'discord-bot-player.com'
          },
          color: '#0099ff',
          description: 'any_description',
          fields: [
            {
              name: 'test',
              value: 'value for test'
            },
            {
              name: 'test 2',
              value: 'value for test 2'
            }
          ],
          title: 'any_title',
          url: 'discord-bot-player.com'
        }
      ],
      components: [
        {
          components: [
            {
              custom_id: 'testId',
              label: 'test label',
              style: 1,
              type: 2
            }
          ],
          type: 1
        }
      ]
    });
  });

  test('should call send with correct components', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      buttons: [
        { label: 'test label', customId: 'testId', style: ButtonStyle.Primary },
        { label: 'test label 2', customId: 'testId2', style: ButtonStyle.Primary }
      ],
      description: 'any_description'
    });

    const calledWith = JSON.parse(JSON.stringify(sendSpy.mock.calls[0][0]));

    expect(calledWith).toEqual({
      embeds: [
        {
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
      ],
      components: [
        {
          components: [
            {
              custom_id: 'testId',
              label: 'test label',
              style: 1,
              type: 2
            },
            {
              custom_id: 'testId2',
              label: 'test label 2',
              style: 1,
              type: 2
            }
          ],
          type: 1
        }
      ]
    });
  });

  test('should call send with correct components when calling twice', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      buttons: [
        { label: 'test label', customId: 'testId', style: ButtonStyle.Primary },
        { label: 'test label 2', customId: 'testId2', style: ButtonStyle.Primary }
      ],
      description: 'any_description'
    });
    await sut.send({
      title: 'any_title',
      buttons: [
        { label: 'test label', customId: 'testId', style: ButtonStyle.Primary },
        { label: 'test label 2', customId: 'testId2', style: ButtonStyle.Primary }
      ],
      description: 'any_description'
    });

    const calledWith = JSON.parse(JSON.stringify(sendSpy.mock.calls[0][0]));

    expect(calledWith).toEqual({
      embeds: [
        {
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
      ],
      components: [
        {
          components: [
            {
              custom_id: 'testId',
              label: 'test label',
              style: 1,
              type: 2
            },
            {
              custom_id: 'testId2',
              label: 'test label 2',
              style: 1,
              type: 2
            }
          ],
          type: 1
        }
      ]
    });
  });

  test('should call send with correct components with emoji', async () => {
    const { sut, sendMessageChannelStub } = makeSut();
    const sendSpy = vi.spyOn(sendMessageChannelStub, 'send');

    await sut.send({
      title: 'any_title',
      buttons: [
        { label: 'test label', customId: 'testId', style: ButtonStyle.Primary, emoji: '✅' },
        { label: 'test label 2', customId: 'testId2', style: ButtonStyle.Primary, emoji: '123456789012345678' }
      ],
      description: 'any_description'
    });

    const calledWith = JSON.parse(JSON.stringify(sendSpy.mock.calls[0][0]));

    expect(calledWith).toEqual({
      embeds: [
        {
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
      ],
      components: [
        {
          components: [
            {
              custom_id: 'testId',
              emoji: '✅',
              label: 'test label',
              style: 1,
              type: 2
            },
            {
              custom_id: 'testId2',
              emoji: '123456789012345678',
              label: 'test label 2',
              style: 1,
              type: 2
            }
          ],
          type: 1
        }
      ]
    });
  });
});
