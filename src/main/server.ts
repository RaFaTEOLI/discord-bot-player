import 'module-alias/register';
import {
  ActivityType,
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  Message
} from 'discord.js';
import 'dotenv/config';
import { DiscordSendMessage } from '@/data/usecases/send-message/discord-send-message';
import { makeDiscordSendMessageFactory } from './factories/usecases/discord/discord-send-message-factory';
import { DiscordClient } from '@/domain/models/discord-client';
import { makeDiscordExecuteCommandFactory } from './factories/usecases/discord/discord-execute-command-factory';
import { PlayerModel } from '@/domain/models/player';
import { makeRemoteSaveMusicFactory } from './factories/usecases/remote/remote-save-music-factory';
import { makeRemoteSaveQueueFactory } from './factories/usecases/remote/remote-save-queue-factory';
import { Queue } from '@/domain/models/queue';
import type { QueuedTrack } from '@/domain/music/queued-track';
import { MusicRepeatMode } from '@/domain/music/repeat-mode';
import { playerButtons, getErrorMessageFromError } from '@/presentation/helpers';
import { getCommand } from '@/presentation/helpers/discord-commands/discord-commands';
import { bootstrapYoutubeClient } from '@/infra/music/youtube-client';
import { createGuildMusicManager } from './factories/music/guild-music-manager-factory';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
}) as DiscordClient;

const music = createGuildMusicManager(client);
client.music = music;

client.on('clientReady', () => {
  console.info(`I am ready to Play as ${process.env.BOT_NAME} 🎶`);
  client.user?.setActivity(process.env.BOT_ACTIVITY ?? 'Waiting...', {
    type: ActivityType.Listening
  });
});

const settings: PlayerModel = {
  prefix: process.env.BOT_PREFIX,
  token: process.env.BOT_TOKEN,
  bot: {
    name: process.env.BOT_NAME,
    description: process.env.BOT_DESCRIPTION
  }
};

let sendMusicMessage: DiscordSendMessage | null = null;
let sendWelcomeMessage: DiscordSendMessage | null = null;

void (async () => {
  await bootstrapYoutubeClient();
  await client.login(settings.token);
  setTimeout(() => {
    const musicChannel = client.channels.cache.get(process.env.BOT_MUSIC_CHANNEL);
    const welcomeChannel = client.channels.cache.get(process.env.BOT_WELCOME_CHANNEL);

    if (musicChannel?.isTextBased()) {
      sendMusicMessage = makeDiscordSendMessageFactory(musicChannel);
    }
    if (welcomeChannel?.isTextBased()) {
      sendWelcomeMessage = makeDiscordSendMessageFactory(welcomeChannel);
    }
  }, 5000);
})();

const remoteSaveQueue = makeRemoteSaveQueueFactory();

const handleCommands = async (
  message: Message | ButtonInteraction | ChatInputCommandInteraction,
  sendMessage?: DiscordSendMessage
): Promise<void> => {
  if (message) {
    const { args, command } = getCommand(message);
    // `args` is the whole argument string; numeric commands need its words.
    const [firstArg] = args.split(/\s+/).filter(Boolean);

    console.info(`Command received: ${command}`);
    console.info(`Arguments received: ${args}`);

    console.info(`Guild ID: ${message?.guild?.id}`);
    if (message?.guild?.id) {
      const guildQueue = client.music.getQueue(message?.guild?.id);
      const replyTarget = sendMessage ?? sendMusicMessage;

      if (
        (message instanceof Message || message instanceof ChatInputCommandInteraction) &&
        (command === 'play' || command === 'playlist')
      ) {
        const queue = client.music.createQueue(message.guild.id);
        if (message instanceof Message && message?.member?.voice?.channel) {
          await queue.join(message?.member?.voice?.channel);
        } else {
          const voiceChannels = message.guild.channels.cache
            .filter(channel => channel.type === ChannelType.GuildVoice && Array.from(channel.members).length > 0)
            .map(channel => channel.id);

          if (voiceChannels.length) {
            await queue.join(voiceChannels[0]);
          } else {
            console.error('There are no voice channel with members to play');
            await sendMusicMessage?.send({
              title: '🔇 No Voice Channel',
              description: 'There are no voice channel with members to play'
            });
          }
        }

        if (command === 'play') {
          await queue.enqueue(args, { forcePlaylist: false }).catch(err => {
            console.error(err);
            if (!guildQueue) queue.stop();
          });
          return;
        }

        if (command === 'playlist') {
          await queue.enqueue(args, { forcePlaylist: true }).catch(err => {
            console.error(err);
            if (!guildQueue) queue.stop();
          });
          return;
        }
      }

      if (command === 'skip') {
        const skipIndex = Number(args);
        guildQueue?.skip(Number.isInteger(skipIndex) ? skipIndex : undefined);
        return;
      }

      if (command === 'stop') {
        guildQueue?.stop();
        return;
      }

      if (command === 'removeLoop') {
        guildQueue?.setRepeatMode(MusicRepeatMode.Disabled);
        return;
      }

      if (command === 'toggleLoop') {
        guildQueue?.setRepeatMode(MusicRepeatMode.Track);
        return;
      }

      if (command === 'toggleQueueLoop') {
        guildQueue?.setRepeatMode(MusicRepeatMode.Queue);
        return;
      }

      if (command === 'setVolume') {
        guildQueue?.setVolume(parseInt(args[0]));
        return;
      }

      if (command === 'seek') {
        const seconds = Number(firstArg);
        const seeked = guildQueue && Number.isFinite(seconds) ? await guildQueue.seek(seconds * 1000) : false;
        await sendMusicMessage?.send({
          title: '🎵  Seek',
          description: seeked
            ? `Jumped to ${Math.floor(seconds / 60)}:${(Math.floor(seconds) % 60).toString().padStart(2, '0')}.`
            : 'Could not seek in the current song.'
        });
        return;
      }

      if (command === 'clearQueue') {
        guildQueue?.clearQueue();
        return;
      }

      if (command === 'shuffle') {
        guildQueue?.shuffle();
        return;
      }

      if (command === 'getQueue') {
        console.info(`Getting guild queue -> ${guildQueue}`);

        const messageObj = {
          title: '🎵  Queue'
        };

        await remoteSaveQueue.save({ songs: mapQueue(guildQueue?.songs ?? []) });

        const fields: any = [];
        guildQueue?.songs.forEach((song, i) => {
          const songOrder = i + 1;
          if (songOrder < 11) {
            if (songOrder === 1) {
              fields.push({
                name: `▶️  #${songOrder}`,
                value: `${song.name} - ${song.author}`
              });
            } else {
              fields.push({
                name: `⏭️  #${songOrder}`,
                value: `${song.name} - ${song.author}`
              });
            }
          }
        });

        if (fields.length) {
          Object.assign(messageObj, { fields });
        }

        if (guildQueue?.songs) {
          if (guildQueue?.songs?.length > 10) {
            Object.assign(messageObj, {
              description: 'Showing next 10 songs in the queue...'
            });
          }
        }

        await sendMusicMessage?.send(messageObj);
        return;
      }

      if (command === 'getVolume') {
        console.info(`Getting volume -> ${guildQueue?.volume}`);
        await sendMusicMessage?.send({
          title: '🎙️  Volume',
          fields: {
            name: 'Current Volume',
            value: guildQueue?.volume.toString() ?? '130'
          }
        });
        return;
      }

      if (command === 'nowPlaying') {
        console.info(`Now playing: ${guildQueue?.nowPlaying}`);
        await replyTarget?.send({
          title: '🎵  Now Playing',
          fields: { name: 'Song', value: guildQueue?.nowPlaying?.name ?? '' }
        });
        return;
      }

      if (command === 'pause') {
        guildQueue?.setPaused(true);
        return;
      }

      if (command === 'resume') {
        guildQueue?.setPaused(false);
        return;
      }

      if (command === 'togglePlay') {
        if (guildQueue?.isPlaying) {
          guildQueue?.setPaused(true);
        } else {
          guildQueue?.setPaused(false);
        }
        return;
      }

      if (command === 'remove') {
        guildQueue?.remove(parseInt(args[0]));
        return;
      }

      if (command === 'createProgressBar') {
        const ProgressBar = guildQueue?.createProgressBar();
        console.info(`Progress Bar -> ${ProgressBar?.prettier}`);
        await sendMusicMessage?.send({
          title: '🎶  Progress Bar',
          fields: {
            name: 'Progress Bar',
            value: ProgressBar?.prettier ?? '[==============>][0:00/0:00]'
          }
        });
        return;
      }

      if (command === 'move') {
        guildQueue?.move(parseInt(args[0]), parseInt(args[1]));
      }
    }

    if (message instanceof Message || message instanceof ChatInputCommandInteraction) {
      const executeCommand = makeDiscordExecuteCommandFactory(client, message, settings);
      try {
        return await executeCommand.execute(command);
      } catch (error) {
        console.error(error);
        const errorMessage = getErrorMessageFromError(error);
        await sendMessage?.send(errorMessage);
      }
    }
  }
};

client.on('messageCreate', async message => {
  if (message.author.bot && message.author.username !== `${process.env.BOT_NAME} Web`) {
    return;
  }
  if (!message.content.startsWith(settings?.prefix ?? '!')) return;

  const sendMessage = makeDiscordSendMessageFactory(message.channel);

  await handleCommands(message, sendMessage);
});

client.on('interactionCreate', async (message: ButtonInteraction | ChatInputCommandInteraction) => {
  if (message instanceof ButtonInteraction) {
    await message.deferUpdate();
  }
  if (message instanceof ChatInputCommandInteraction) {
    await message.reply({ content: 'Processing...', ephemeral: true });
  }
  await handleCommands(message, sendMusicMessage ?? undefined);
});

client.on('guildMemberAdd', async member => {
  console.info(`New member added: ${member}`);
  await sendWelcomeMessage?.send({
    title: `🙌  Welcome to the server ${member.displayName}`
  });
});

client.on('channelCreate', async channel => {
  console.info(`Channel created: ${channel}`);
});

client.on('channelUpdate', async channel => {
  console.info(`Channel updated: ${channel}`);
});

client.on('channelDelete', async channel => {
  console.info(`Channel deleted: ${channel}`);
});

const remoteSaveMusic = makeRemoteSaveMusicFactory();

const mapQueue = (songs: QueuedTrack[]): Queue =>
  songs
    .map(song => ({
      name: song?.name,
      author: song?.author,
      duration: song?.duration,
      thumbnail: song?.thumbnail,
      url: song?.url
    }))
    .slice(0, 30) as Queue;

music
  .on('channelEmpty', async queue => {
    console.info(`Everyone left the Voice Channel, queue ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Everyone left the Voice Channel, queue ended.'
    });
    await remoteSaveMusic.save({ name: null, duration: null });
    await remoteSaveQueue.save({ songs: [] });
  })
  .on('songAdd', async (queue, song: QueuedTrack) => {
    console.info(`Song ${song} was added to the queue. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Song added to the queue.',
      fields: {
        name: 'Song',
        value: song.name
      }
    });
    await remoteSaveQueue.save({ songs: mapQueue(queue.songs) });
  })
  .on('playlistAdd', async (queue, playlist: { name: string; songs: QueuedTrack[] }) => {
    console.info(`Playlist ${playlist.name} with ${playlist?.songs?.length} songs was added to the queue.`);
    await sendMusicMessage?.send({
      title: '🎵  Playlist Added!',
      description: `Playlist ${playlist.name} with ${playlist?.songs?.length} songs was added to the queue.`
    });
    await remoteSaveQueue.save({ songs: mapQueue(queue.songs) });
  })
  .on('queueDestroyed', async queue => {
    console.info(`The queue was destroyed. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Queue was destroyed.'
    });
    await remoteSaveQueue.save({ songs: [] });
  })
  .on('queueEnd', async queue => {
    console.info(`The queue has ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  The queue has ended.'
    });
    await remoteSaveMusic.save({ name: null, duration: null });
    await remoteSaveQueue.save({ songs: [] });
  })
  .on('songChanged', async (queue, newSong: QueuedTrack, _oldSong: QueuedTrack | null) => {
    console.info(`${newSong} is now playing`);
    await sendMusicMessage?.send({
      title: '🎵  Now Playing',
      fields: {
        name: 'Song',
        value: newSong.name
      },
      buttons: playerButtons
    });
    await remoteSaveMusic.save({ name: newSong.name, duration: newSong.duration });
    await remoteSaveQueue.save({ songs: mapQueue(queue.songs) });
  })
  .on('songFirst', async (queue, song: QueuedTrack) => {
    console.info(`Started Playing ${song}`);
    await sendMusicMessage?.send({
      title: '🎵  Started Playing',
      fields: {
        name: 'Song',
        value: song.name
      },
      buttons: playerButtons
    });
    await remoteSaveMusic.save({ name: song.name, duration: song.duration });
  })
  .on('clientDisconnect', async queue => {
    console.info(`I was kicked from the Voice Channel, queue ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '😞  I was kicked from the Voice Channel, queue ended.'
    });
    await remoteSaveMusic.save({ name: null, duration: null });
    await remoteSaveQueue.save({ songs: [] });
  })
  .on('clientUndeafen', async queue => {
    console.info(`I got undefeanded. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  I got undefeanded.'
    });
  })
  .on('error', async (error, queue) => {
    console.error(`${error} in ${queue.guild?.name ?? 'unknown guild'}`);
    const errorMessage = getErrorMessageFromError(error);
    await sendMusicMessage?.send(errorMessage);
  });
