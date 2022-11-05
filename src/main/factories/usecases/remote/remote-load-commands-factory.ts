import { RemoteLoadCommands } from '@/data/usecases/load-commands/remote-load-commands';
import { makeApiUrl } from '@/main/factories/http';
import { makeAuthorizeHttpClientDecorator } from '@/main/factories/decorators';
import { LoadCommands } from '@/domain/usecases/load-commands';

export const makeRemoteLoadCommandsFactory = (): LoadCommands => {
  return new RemoteLoadCommands(makeApiUrl('/commands'), makeAuthorizeHttpClientDecorator());
};
