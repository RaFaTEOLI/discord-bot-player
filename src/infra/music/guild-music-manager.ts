import { EventEmitter } from 'node:events';
import type { Client } from 'discord.js';
import type { IGuildMusicQueue, MusicPlayerFacade } from '@/domain/music/guild-music-queue';
import type { SpotifyCredentials } from './resolve-playable-url';
import { GuildMusicSession } from './guild-music-session';

export class GuildMusicManager extends EventEmitter implements MusicPlayerFacade {
  private readonly sessions = new Map<string, GuildMusicSession>();

  constructor(
    private readonly client: Client,
    private readonly spotifyCreds: SpotifyCredentials | null
  ) {
    super();
  }

  createQueue(guildId: string): IGuildMusicQueue {
    let s = this.sessions.get(guildId);
    if (!s) {
      s = new GuildMusicSession(this.client, guildId, (ev, ...args) => {
        this.emit(ev, ...args);
        if (ev === 'queueEnd' || ev === 'queueDestroyed') {
          this.sessions.delete(guildId);
        }
      }, this.spotifyCreds);
      this.sessions.set(guildId, s);
    }
    return s;
  }

  getQueue(guildId: string): IGuildMusicQueue | undefined {
    return this.sessions.get(guildId);
  }

  setup(client: Client): void {
    client.on('voiceStateUpdate', (_oldState, newState) => {
      const guildId = newState.guild.id;
      const session = this.sessions.get(guildId);
      if (!session?.voiceChannelId) return;
      const ch = newState.guild.channels.cache.get(session.voiceChannelId);
      if (!ch?.isVoiceBased()) return;
      const humans = ch.members.filter(m => !m.user.bot);
      if (humans.size !== 0) return;
      this.emit('channelEmpty', session);
      session.channelEmptyCleanup();
      this.sessions.delete(guildId);
    });
  }
}
