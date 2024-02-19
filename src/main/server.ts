import 'module-alias/register';
import {
  ActivityType,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  Message
} from 'discord.js';
import { Player, RepeatMode, Song } from '@rafateoli/discord-music-player';
import 'dotenv/config';
import { DiscordSendMessage } from '@/data/usecases/send-message/discord-send-message';
import { makeDiscordSendMessageFactory } from './factories/usecases/discord/discord-send-message-factory';
import { DiscordClient } from '@/domain/models/discord-client';
import { makeDiscordExecuteCommandFactory } from './factories/usecases/discord/discord-execute-command-factory';
import { PlayerModel } from '@/domain/models/player';
import { makeRemoteSaveMusicFactory } from './factories/usecases/remote/remote-save-music-factory';
import { makeRemoteSaveQueueFactory } from './factories/usecases/remote/remote-save-queue-factory';
import { Queue } from '@/domain/models/queue';
import { playerButtons, getErrorMessageFromError } from '@/presentation/helpers';
import { getCommand } from '@/presentation/helpers/discord-commands/discord-commands';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
}) as DiscordClient;

const player = new Player(client, {
  leaveOnEmpty: true,
  leaveOnEnd: true,
  timeout: 0,
  volume: 150,
  quality: 'high'
});

client.player = player;

client.on('ready', () => {
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
  await client.login(settings.token);
  // Channel Dispatchers
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

    console.info(`Command received: ${command}`);
    console.info(`Arguments received: ${args}`);

    console.info(`Guild ID: ${message?.guild?.id}`);
    if (message?.guild?.id) {
      const guildQueue = client.player.getQueue(message?.guild?.id);

      if (
        (message instanceof Message || message instanceof ChatInputCommandInteraction) &&
        (command === 'play' || command === 'playlist')
      ) {
        const queue = client.player.createQueue(message.guild.id);
        if (message instanceof Message && message?.member?.voice?.channel) {
          await queue.join(message?.member?.voice?.channel);
        } else {
          // Auto assign a channel for the bot to join
          const voiceChannels = message.guild.channels.cache
            .filter(channel => channel.type === 2 && Array.from(channel.members).length > 0)
            .map(channel => channel.id);

          if (voiceChannels.length) {
            await queue.join(voiceChannels[0]);
          } else {
            console.error('There are no voice channel with members to play');
            await sendMusicMessage.send({
              title: '🔇 No Voice Channel',
              description: 'There are no voice channel with members to play'
            });
          }
        }

        if (command === 'play') {
          await queue.play(args).catch(err => {
            console.error(err);
            if (!guildQueue) queue.stop();
          });
          return;
        }

        if (command === 'playlist') {
          await queue.playlist(args).catch(err => {
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
        guildQueue?.setRepeatMode(RepeatMode.DISABLED); // or 0 instead of RepeatMode.DISABLED
        return;
      }

      if (command === 'toggleLoop') {
        guildQueue?.setRepeatMode(RepeatMode.SONG); // or 1 instead of RepeatMode.SONG
        return;
      }

      if (command === 'toggleQueueLoop') {
        guildQueue?.setRepeatMode(RepeatMode.QUEUE); // or 2 instead of RepeatMode.QUEUE
        return;
      }

      if (command === 'setVolume') {
        guildQueue?.setVolume(parseInt(args[0]));
        return;
      }

      if (command === 'seek') {
        void guildQueue?.seek(parseInt(args[0]) * 1000);
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

        await remoteSaveQueue.save({ songs: mapQueue(guildQueue?.songs) });

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
        await sendMessage.send({
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
    }

    if (message instanceof Message) {
      const executeCommand = makeDiscordExecuteCommandFactory(client, message, settings);
      try {
        return await executeCommand.execute(command);
      } catch (error) {
        console.error(error);
        const errorMessage = getErrorMessageFromError(error);
        await sendMessage.send(errorMessage);
      }
    }
  }
};

client.on('messageCreate', async message => {
  // Message Validations
  if (message.author.bot && message.author.username !== `${process.env.BOT_NAME} Web`) {
    return;
  }
  if (!message.content.startsWith(settings?.prefix ?? '!')) return;

  // Send message to current channel
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
  await handleCommands(message);
});

// New Member
client.on('guildMemberAdd', async member => {
  console.info(`New member added: ${member}`);
  await sendWelcomeMessage?.send({
    title: `🙌  Welcome to the server ${member.displayName}`
  });
});

const remoteSaveMusic = makeRemoteSaveMusicFactory();

const mapQueue = (songs: Song[]): Queue =>
  songs
    .map(song => ({
      name: song?.name,
      author: song?.author,
      duration: song?.duration,
      thumbnail: song?.thumbnail,
      url: song?.url
    }))
    .slice(0, 30) as Queue;

// Init the event listener only once (at the top of your code).
client.player
  // Emitted when channel was empty.
  .on('channelEmpty', async queue => {
    console.info(`Everyone left the Voice Channel, queue ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Everyone left the Voice Channel, queue ended.'
    });
    await remoteSaveMusic.save({ name: null, duration: null });
  })
  // Emitted when a song was added to the queue.
  .on('songAdd', async (queue, song) => {
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
  // Emitted when a playlist was added to the queue.
  .on('playlistAdd', async (queue, playlist) => {
    console.info(`Playlist ${playlist.name} with ${playlist?.songs?.length} songs was added to the queue.`);
    await sendMusicMessage?.send({
      title: '🎵  Playlist Added!',
      description: `Playlist ${playlist.name} with ${playlist?.songs?.length} songs was added to the queue.`
    });
    await remoteSaveQueue.save({ songs: mapQueue(queue.songs) });
  })
  // Emitted when there was no more music to play.
  .on('queueDestroyed', async queue => {
    console.info(`The queue was destroyed. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Queue was destroyed.'
    });
    await remoteSaveQueue.save({ songs: [] });
  })
  // Emitted when the queue was destroyed (either by ending or stopping).
  .on('queueEnd', async queue => {
    console.info(`The queue has ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  The queue has ended.'
    });
    await remoteSaveMusic.save({ name: null, duration: null });
    await remoteSaveQueue.save({ songs: [] });
  })
  // Emitted when a song changed.
  .on('songChanged', async (queue, newSong, oldSong) => {
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
  // Emitted when a first song in the queue started playing.
  .on('songFirst', async (queue, song) => {
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
  // Emitted when someone disconnected the bot from the channel.
  .on('clientDisconnect', async queue => {
    console.info(`I was kicked from the Voice Channel, queue ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '😞  I was kicked from the Voice Channel, queue ended.'
    });
    await remoteSaveMusic.save({ name: null, duration: null });
    await remoteSaveQueue.save({ songs: [] });
  })
  // Emitted when deafenOnJoin is true and the bot was undeafened
  .on('clientUndeafen', async queue => {
    console.info(`I got undefeanded. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  I got undefeanded.'
    });
  })
  // Emitted when there was an error in runtime
  .on('error', async (error, queue) => {
    console.error(`${error} in ${queue.guild.name}`);
    const errorMessage = getErrorMessageFromError(error);
    await sendMusicMessage.send(errorMessage);
  });
