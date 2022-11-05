import { CommandModel } from '@/domain/models/command';
import { PlayerModel } from '@/domain/models/player';
import { ExecuteCommand } from '@/domain/usecases/execute-command';
import { LoadCommand } from '@/domain/usecases/load-command';
import { LoadCommands } from '@/domain/usecases/load-commands';
import { PlayMusic } from '@/domain/usecases/play-music';
import { SendMessage } from '@/domain/usecases/send-message';

export class DiscordExecuteCommand implements ExecuteCommand {
  constructor(
    private readonly remoteLoadCommand: LoadCommand,
    private readonly sendMessageChannel: SendMessage,
    private readonly discordPlayMusic: PlayMusic,
    private readonly playerSettings: PlayerModel,
    private readonly remoteLoadCommands: LoadCommands
  ) {}

  async execute(commandValue: string): Promise<void> {
    if (
      commandValue.toLowerCase() === this.playerSettings.bot.name.toLowerCase() ||
      commandValue === 'showPlaylists'
    ) {
      const remoteCommands = await this.remoteLoadCommands.load();

      const query =
        commandValue === 'showPlaylists'
          ? (command: CommandModel) => command.type === 'music'
          : command => command.type !== 'music';

      const commandFields = remoteCommands
        .filter(query)
        .map(command => ({ name: `${this.playerSettings.prefix}${command.command}`, value: command.description }));

      const messageTitle =
        commandValue === 'showPlaylists' ? '📀  Playlists' : this.playerSettings.bot.description;

      return await this.sendMessageChannel.send({
        title: messageTitle,
        fields: commandFields.length ? commandFields : [{ name: 'Message', value: 'Nothing found!' }]
      });
    }

    const command = await this.remoteLoadCommand.load(commandValue);
    if (!command) {
      return await this.sendMessageChannel.send({
        title: 'Invalid Command!',
        description: 'The command you tried is invalid!'
      });
    }

    switch (command.type) {
      case 'music':
        await this.discordPlayMusic.play(command.response, true);
        return;
      case 'message':
        return await this.sendMessageChannel.send({
          title: command.response
        });
      default:
        return await this.sendMessageChannel.send({
          title: 'Invalid Command Type!',
          description: 'The command type you tried is invalid!'
        });
    }
  }
}
