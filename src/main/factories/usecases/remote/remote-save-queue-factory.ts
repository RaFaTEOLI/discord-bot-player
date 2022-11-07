import { RemoteSaveQueue } from '@/data/usecases/save-queue/remote-save-queue';
import { makeApiUrl } from '@/main/factories/http';
import { makeAuthorizeHttpClientDecorator } from '@/main/factories/decorators';
import { SaveQueue } from '@/domain/usecases/save-queue';

export const makeRemoteSaveQueueFactory = (): SaveQueue => {
  return new RemoteSaveQueue(makeApiUrl('/queue'), makeAuthorizeHttpClientDecorator());
};
