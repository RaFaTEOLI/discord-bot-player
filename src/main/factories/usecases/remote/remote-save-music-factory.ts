import { RemoteSaveMusic } from '@/data/usecases/save-music/remote-save-music';
import { makeApiUrl, useApiQueueFactory } from '@/main/factories/http';
import { makeAuthorizeHttpClientDecorator } from '@/main/factories/decorators';
import { SaveMusic } from '@/domain/usecases/save-music';
import { makeAmqpClient } from '@/main/factories/queue/amqp-client-factory';

export const makeRemoteSaveMusicFactory = (): SaveMusic => {
  return new RemoteSaveMusic(
    makeApiUrl('/music'),
    makeAuthorizeHttpClientDecorator(),
    makeAmqpClient(),
    useApiQueueFactory()
  );
};
