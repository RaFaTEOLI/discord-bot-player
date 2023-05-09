import { mockMusicModel } from '@/domain/test/mock-music';
import { SaveMusicParams } from '@/domain/usecases/save-music';
import { SaveQueueParams } from '@/domain/usecases/save-queue';
import { AmqpClient } from '@/infra/queue/amqp-client';

const mockSendToQueue = jest.fn();

jest.mock('amqplib', () => {
  return {
    __esModule: true,
    connect: jest.fn().mockImplementation(
      async () =>
        await Promise.resolve({
          createChannel: async () => ({ sendToQueue: mockSendToQueue })
        })
    )
  };
});

type SutTypes = {
  sut: AmqpClient<SaveMusicParams | SaveQueueParams>;
};

const makeSut = async (): Promise<SutTypes> => {
  const sut = new AmqpClient();
  return {
    sut
  };
};

describe('AmqpClient', () => {
  test('should call send with correct values for music', async () => {
    const { sut } = await makeSut();
    const musicModel = mockMusicModel();
    await sut.send('music', musicModel);
    expect(mockSendToQueue).toHaveBeenCalledWith('music', Buffer.from(JSON.stringify(musicModel)));
  });
});
