import { AmqpClientSpy, HttpClientSpy } from '@/data/test';
import { RemoteSaveMusic } from './remote-save-music';
import { HttpStatusCode } from '@/data/protocols/http';
import { AccessDeniedError, UnexpectedError } from '@/domain/errors';
import { faker } from '@faker-js/faker';
import { mockMusicModel } from '@/domain/test/mock-music';

type SutTypes = {
  sut: RemoteSaveMusic;
  httpClientSpy: HttpClientSpy;
  amqpClientSpy: AmqpClientSpy;
};

const makeSut = (url = faker.internet.url(), useApiQueue = false): SutTypes => {
  const httpClientSpy = new HttpClientSpy();
  const amqpClientSpy = new AmqpClientSpy();
  const sut = new RemoteSaveMusic(url, httpClientSpy, amqpClientSpy, useApiQueue);

  return {
    sut,
    httpClientSpy,
    amqpClientSpy
  };
};

describe('RemoteSaveMusic', () => {
  test('should call HttpClient with correct URL and Method', async () => {
    const url = faker.internet.url();
    const { sut, httpClientSpy } = makeSut(url);
    const body = mockMusicModel();
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
    const promise = sut.save(mockMusicModel());
    await expect(promise).rejects.toThrow(new AccessDeniedError());
  });

  test('should throw UnexpectedError if HttpClient returns 404', async () => {
    const { sut, httpClientSpy } = makeSut();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.notFound
    };
    const promise = sut.save(mockMusicModel());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });

  test('should throw UnexpectedError if HttpClient returns 500', async () => {
    const { sut, httpClientSpy } = makeSut();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.serverError
    };
    const promise = sut.save(mockMusicModel());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });

  test('should return void if HttpClient returns 204', async () => {
    const { sut, httpClientSpy } = makeSut();
    const httpResult = mockMusicModel();
    httpClientSpy.response = {
      statusCode: HttpStatusCode.noContent,
      body: httpResult
    };
    const response = await sut.save(mockMusicModel());
    expect(response).toBeFalsy();
  });

  test('should call AmqpClientSpy with correct queue and data when useApiQueue is true', async () => {
    const url = faker.internet.url();
    const { sut, amqpClientSpy } = makeSut(url, true);
    const sendSpy = jest.spyOn(amqpClientSpy, 'send');
    const body = mockMusicModel();
    await sut.save(body);
    expect(sendSpy).toHaveBeenCalledWith('music', body);
  });
});
