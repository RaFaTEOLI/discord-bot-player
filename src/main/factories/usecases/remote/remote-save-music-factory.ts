import { RemoteSaveMusic } from '@/data/usecases/save-music/remote-save-music';
import { makeApiUrl } from '@/main/factories/http';
import { makeAuthorizeHttpClientDecorator } from '@/main/factories/decorators';
import { SaveMusic } from '@/domain/usecases/save-music';

export const makeRemoteSaveMusicFactory = (): SaveMusic => {
  return new RemoteSaveMusic(makeApiUrl('/music'), makeAuthorizeHttpClientDecorator());
};
