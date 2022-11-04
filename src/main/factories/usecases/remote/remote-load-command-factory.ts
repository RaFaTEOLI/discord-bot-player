import { RemoteLoadCommand } from '@/data/usecases/load-command/remote-load-command';
import { makeApiUrl } from '@/main/factories/http';
import { makeAuthorizeHttpClientDecorator } from '@/main/factories/decorators';
import { LoadCommand } from '@/domain/usecases/load-command';

export const makeRemoteLoadCommandFactory = (): LoadCommand => {
  return new RemoteLoadCommand(makeApiUrl('/commands'), makeAuthorizeHttpClientDecorator());
};
