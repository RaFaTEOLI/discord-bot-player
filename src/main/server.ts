import 'module-alias/register';
import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { Player, RepeatMode } from 'discord-music-player';
import 'dotenv/config';
import { DiscordSendMessage } from '@/data/usecases/send-message/discord-send-message';
import { makeDiscordSendMessageFactory } from './factories/usecases/discord/discord-send-message-factory';

interface DiscordClient extends Client {
  player: Player;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
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
  console.log(`[INFO] I am ready to Play as ${process.env.BOT_NAME} 🎶`);
  client.user?.setActivity(process.env.BOT_ACTIVITY ?? 'Waiting...', {
    type: ActivityType.Playing
  });
});

const settings = {
  prefix: process.env.BOT_PREFIX,
  token: process.env.BOT_TOKEN
};
void client.login(settings.token);

// Channel Dispatchers
const musicChannel = client.channels.cache.get(process.env.BOT_MUSIC_CHANNEL ?? '');
const welcomeChannel = client.channels.cache.get(process.env.BOT_WELCOME_CHANNEL ?? '');

let sendMusicMessage: DiscordSendMessage | null = null;
let sendWelcomeMessage: DiscordSendMessage | null = null;

if (musicChannel?.isTextBased()) {
  sendMusicMessage = makeDiscordSendMessageFactory(musicChannel);
}
if (welcomeChannel?.isTextBased()) {
  sendWelcomeMessage = makeDiscordSendMessageFactory(welcomeChannel);
}

client.on('messageCreate', async message => {
  // Message Validations
  if (message.author.bot && message.author.username !== `${process.env.BOT_NAME} Web`) {
    return;
  }
  if (!message.content.startsWith(settings?.prefix ?? '!')) return;

  // Send message to current channel
  const sendMessage = makeDiscordSendMessageFactory(message.channel);

  if (message) {
    const args = message.content.slice(settings?.prefix?.length).trim().split(/ +/g);
    const command = args.shift();

    console.log(`[INFO] Command received: ${command}`);

    console.log(`[INFO] Guild ID: ${message?.guild?.id}`);
    if (message?.guild?.id) {
      const guildQueue = client.player.getQueue(message?.guild?.id);

      if (command === 'play' || command === 'playlist') {
        const queue = client.player.createQueue(message.guild.id);
        if (message?.member?.voice?.channel) {
          await queue.join(message?.member?.voice?.channel);
        }

        if (command === 'play') {
          await queue.play(args.join(' ')).catch(err => {
            console.log(err);
            if (!guildQueue) queue.stop();
          });
          return;
        }

        if (command === 'playlist') {
          await queue.playlist(args.join(' ')).catch(err => {
            console.log(err);
            if (!guildQueue) queue.stop();
          });
          return;
        }
      }

      if (command === 'skip') {
        guildQueue?.skip();
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
        console.log(`[INFO] Getting guild queue -> ${guildQueue}`);

        const messageObj = {
          title: '🎵  Queue'
        };

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
        console.log(`[INFO] Getting volume -> ${guildQueue?.volume}`);
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
        console.log(`[INFO] Now playing: ${guildQueue?.nowPlaying}`);
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

      if (command === 'remove') {
        guildQueue?.remove(parseInt(args[0]));
        return;
      }

      if (command === 'createProgressBar') {
        const ProgressBar = guildQueue?.createProgressBar();
        console.log(`[INFO] Progress Bar -> ${ProgressBar?.prettier}`);
        await sendMusicMessage?.send({
          title: '🎶  Progress Bar',
          fields: {
            name: '',
            value: ProgressBar?.prettier?.toString() ?? ''
          }
        });
      }
    }
  }
});

// New Member
client.on('guildMemberAdd', async member => {
  await sendWelcomeMessage?.send({
    title: `🙌  Welcome to the server ${member.displayName}`
  });
});

// Init the event listener only once (at the top of your code).
client.player
  // Emitted when channel was empty.
  .on('channelEmpty', async queue => {
    console.log(`[INFO] Everyone left the Voice Channel, queue ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Everyone left the Voice Channel, queue ended.'
    });
  })
  // Emitted when a song was added to the queue.
  .on('songAdd', async (queue, song) => {
    console.log(`[INFO] Song ${song} was added to the queue. -> ${queue}`);
    await sendMusicMessage?.send({
      title: `🎵  Song ${song} was added to the queue.`
    });
  })
  // Emitted when a playlist was added to the queue.
  .on('playlistAdd', async (queue, playlist) => {
    console.log(`[INFO] Playlist ${playlist} with ${playlist?.songs?.length} was added to the queue.`);
    await sendMusicMessage?.send({
      title: `🎵  Playlist ${playlist} with ${playlist?.songs?.length} was added to the queue.`
    });
  })
  // Emitted when there was no more music to play.
  .on('queueDestroyed', async queue => {
    console.log(`[INFO] The queue was destroyed. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Queue was destroyed.'
    });
  })
  // Emitted when the queue was destroyed (either by ending or stopping).
  .on('queueEnd', async queue => {
    console.log(`[INFO] The queue has ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  The queue has ended.'
    });
  })
  // Emitted when a song changed.
  .on('songChanged', async (queue, newSong, oldSong) => {
    console.log(`[INFO] ${newSong} is now playing. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Now Playing',
      fields: {
        name: 'Song',
        value: newSong.name
      }
    });
  })
  // Emitted when a first song in the queue started playing.
  .on('songFirst', async (queue, song) => {
    console.log(`[INFO] Started playing ${song}. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  Started playing',
      fields: {
        name: 'Song',
        value: song.name
      }
    });
  })
  // Emitted when someone disconnected the bot from the channel.
  .on('clientDisconnect', async queue => {
    console.log(`[INFO] I was kicked from the Voice Channel, queue ended. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '😞  I was kicked from the Voice Channel, queue ended.'
    });
  })
  // Emitted when deafenOnJoin is true and the bot was undeafened
  .on('clientUndeafen', async queue => {
    console.log(`[INFO] I got undefeanded. -> ${queue}`);
    await sendMusicMessage?.send({
      title: '🎵  I got undefeanded.'
    });
  })
  // Emitted when there was an error in runtime
  .on('error', async (error, queue) => {
    console.log(`[ERROR] ${error} in ${queue.guild.name}`);
    await sendMusicMessage?.send({
      title: '⛔  Error.',
      fields: {
        name: 'message',
        value: `${error} in ${queue.guild.name}`
      }
    });
  });
