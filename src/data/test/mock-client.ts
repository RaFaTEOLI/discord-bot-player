import { Player } from 'discord-music-player';

export const mockClient = (): any => {
  class ClientStub {
    private readonly player: Player;
  }
  return new ClientStub();
};
