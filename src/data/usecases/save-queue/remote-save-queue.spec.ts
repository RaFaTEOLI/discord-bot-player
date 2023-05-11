import { AmqpClientSpy, HttpClientSpy } from '@/data/test';
import { RemoteSaveQueue } from './remote-save-queue';
import { HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { faker } from '@faker-js/faker';
import { mockQueueModel } from '@/domain/test/mock-queue';

type SutTypes = {
  sut: RemoteSaveQueue;
  httpClientSpy: HttpClientSpy;
  amqpClientSpy: AmqpClientSpy;
};

const makeSut = (url = faker.internet.url(), useApiQueue = false): SutTypes => {
  const httpClientSpy = new HttpClientSpy();
  const amqpClientSpy = new AmqpClientSpy();
  const sut = new RemoteSaveQueue(url, httpClientSpy, amqpClientSpy, useApiQueue);

  return {
    sut,
    httpClientSpy,
    amqpClientSpy
  };
};

describe('RemoteSaveQueue', () => {
  test('should call HttpClient with correct URL and Method', async () => {
    const url = faker.internet.url();
    const { sut, httpClientSpy } = makeSut(url);
    const body = mockQueueModel();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.noContent
    };
    await sut.save(body);
    expect(httpClientSpy.url).toBe(url);
    expect(httpClientSpy.method).toBe('post');
    expect(httpClientSpy.body).toEqual(body);
  });

  test('should throw AccessDeniedError if HttpClient returns 403', async () => {
    const { sut, httpClientSpy } = makeSut();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.forbidden
    };
    const promise = sut.save(mockQueueModel());
    await expect(promise).rejects.toThrow(new AccessDeniedError());
  });

  test('should throw UnexpectedError if HttpClient returns 404', async () => {
    const { sut, httpClientSpy } = makeSut();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.notFound
    };
    const promise = sut.save(mockQueueModel());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });

  test('should throw UnexpectedError if HttpClient returns 500', async () => {
    const { sut, httpClientSpy } = makeSut();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.serverError
    };
    const promise = sut.save(mockQueueModel());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });

  test('should return void if HttpClient returns 204', async () => {
    const { sut, httpClientSpy } = makeSut();
    const httpResult = mockQueueModel();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.noContent,
      body: httpResult
    };
    const response = await sut.save(mockQueueModel());
    expect(response).toBeFalsy();
  });

  test('should call AmqpClient with correct queue and data when useApiQueue is true', async () => {
    const url = faker.internet.url();
    const { sut, amqpClientSpy } = makeSut(url, true);
    const sendSpy = jest.spyOn(amqpClientSpy, 'send');
    const body = mockQueueModel();
    await sut.save(body);
    expect(sendSpy).toHaveBeenCalledWith('queue', body);
  });

  test('should call console.error when AmqpClient fails', async () => {
    const url = faker.internet.url();
    const { sut, amqpClientSpy } = makeSut(url, true);
    jest.spyOn(amqpClientSpy, 'send').mockRejectedValue(new Error());
    const errorLogSpy = jest.spyOn(console, 'error');
    const body = mockQueueModel();
    await sut.save(body);
    expect(errorLogSpy).toHaveBeenCalledWith(
      `Error sending music queue payload to API Queue: ${JSON.stringify(body)} with error: ${new Error().message}`
    );
  });
});
