# Agent guide: discord-bot-player

This document orients coding agents and contributors to how the repo is organized, how to run it, and where to make changes safely.

## What this project is

A **Node.js Discord bot** that plays music with its own voice queue (`GuildMusicSession` on `@discordjs/voice`) on top of **discord.js v14**, using **youtubei.js** for YouTube search/metadata/audio and the Spotify Web API for Spotify links. It handles prefix commands, slash/button-style interactions, voice channels, and syncs **queue** and **now playing** state to a remote HTTP API and optionally **RabbitMQ**.

Entry point: `src/main/server.ts`.

## Requirements

- **Node.js ≥ 22.12** (see `package.json` → `engines`; needed to `require()` the ESM-only `youtubei.js` from the CommonJS build)
- **Yarn** (scripts and tooling assume it)

## Commands

| Command | Purpose |
|--------|---------|
| `yarn dev` | Run with `tsx watch` (hot reload) |
| `yarn start` | Run once via `tsx` |
| `yarn debug` | Same as dev with inspector on `0.0.0.0:9222` |
| `yarn build` | Emit `dist/` with `tsc -p tsconfig-build.json` |
| `yarn test` | Vitest, run mode, silent |
| `yarn test:ci` | Tests with **Istanbul coverage** and strict thresholds |

## Architecture (clean-ish layers)

Paths under `src/` follow a familiar separation:

| Layer | Path | Role |
|--------|------|------|
| **Domain** | `src/domain/` | Entities, use case interfaces, domain errors, tests/mocks |
| **Data** | `src/data/` | Use case implementations (Discord, remote HTTP), protocols, tests |
| **Infra** | `src/infra/` | Low-level adapters (e.g. `axios-http-client`, `amqp-client`) |
| **Presentation** | `src/presentation/` | Helpers: command parsing, embed copy, buttons, user-facing errors |
| **Main** | `src/main/` | Composition root: `server.ts`, **factories**, **decorators** |

**Wiring rule:** Prefer adding construction and environment-specific choices in `src/main/factories/` (and decorators there), not inside domain interfaces.

## Module paths

- **Source:** `tsconfig.json` maps `@/*` → `src/*` (e.g. `@/domain/...`).
- **Compiled output:** `package.json` `_moduleAliases` maps `@` → `dist` for runtime after `yarn build`.

Vitest resolves `@` to `./src` in `vitest.config.ts`.

## Environment variables

Used across the app (no single `.env.example` in repo; infer from code and `.test/setEnvVars.js`):

| Variable | Used for |
|----------|-----------|
| `BOT_TOKEN` | Discord login |
| `BOT_PREFIX` | Prefix commands (default effectively `!` if unset in helpers) |
| `BOT_NAME`, `BOT_DESCRIPTION`, `BOT_ACTIVITY` | Identity / presence |
| `BOT_MUSIC_CHANNEL`, `BOT_WELCOME_CHANNEL` | Channel IDs for fixed music notifications and welcome DMs-style messages |
| `BOT_URL` | Links / embed author URL in `DiscordSendMessage` |
| `BOT_API_URL` | Base URL for REST API (see `makeApiUrl`) |
| `BOT_API_TOKEN` | Bearer-style auth for HTTP client decorator |
| `BOT_USE_API_QUEUE` | When `'true'`, queue/music persistence uses AMQP path inside remote use cases |
| `BOT_API_QUEUE_USERNAME`, `BOT_API_QUEUE_PASSWORD`, `BOT_API_QUEUE_ADRESS`, `BOT_API_QUEUE_PORT` | AMQP connection string in `AmqpClient` (note: env name `BOT_API_QUEUE_ADRESS` matches source spelling) |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Spotify Web API (client credentials); without them Spotify links are rejected |
| `YOUTUBE_COOKIE` (or `BOT_YOUTUBE_COOKIE`) | Optional browser cookie header for youtube.com; helps when YouTube serves bot checks. Check with `yarn validate:youtube-cookie` |
| `YOUTUBE_PO_TOKEN_GENERATION` | PO tokens are generated automatically (BotGuard via `bgutils-js` in a `jsdom` window, `src/infra/music/youtube-po-token.ts`); set to `false` to disable |
| `YOUTUBE_PO_TOKEN`, `YOUTUBE_VISITOR_DATA` | Optional static proof-of-origin token + matching visitor data passed to `Innertube.create`; setting a static token turns generation off |
| `YOUTUBE_CLIENTS` | Optional comma list of InnerTube clients tried in order for streaming (default `MWEB,YTMUSIC,TV_SIMPLY,IOS`; with a cookie `MWEB,YTMUSIC`, because app clients reject cookie auth with HTTP 400) |

Tests set many of these in `.test/setEnvVars.js`.

## Testing and coverage

- **Runner:** Vitest, Node environment, `globals: true`.
- **Setup:** `.test/setEnvVars.js` runs before tests.
- **Coverage:** `yarn test:ci` enforces **100%** lines, functions, branches, and statements on included paths; `src/main/**` is excluded from coverage includes (see `vitest.config.ts`). When you add logic under covered paths, **add or extend specs** so CI stays green.

Spec files use the `*.spec.ts` suffix.

## Linting and git hooks

- ESLint: Standard + TypeScript (`eslint-config-standard-with-typescript`), config in `.eslintrc.json`.
- **Husky** + **lint-staged** + commit message linter are configured via `package.json` / `.lintstagedrc.json` — respect existing style when editing.

## Notable dependencies

- **discord.js** — gateway, intents, interactions, channels.
- **@discordjs/voice** — voice connection + `AudioPlayer`, driven by `GuildMusicSession` / `GuildMusicManager` in `src/infra/music/` (emits `songAdd`, `queueEnd`, etc.).
- **youtubei.js** — YouTube search, metadata, playlists and audio streams; ESM-only, loaded lazily in `src/infra/music/youtube-client.ts` (which also installs the `node:vm` evaluator it needs to decipher stream URLs). Audio is requested as WebM/Opus so no ffmpeg is needed; other formats fall back to ffmpeg.
- **bgutils-js** + **jsdom** — generate YouTube PO tokens (needed for label-owned music videos). BotGuard runs inside an isolated jsdom window, so its values come from another JS realm: mint with `typeof` checks, not bgutils' `WebPoMinter` (`instanceof` fails across realms). `src/infra/music/bgutils-js.d.ts` maps its subpath exports for the node10 module resolution.
- **amqplib** — optional queue fan-out.
- **isomorphic-unfetch** — HTTP from data layer implementations.

## Where to change behavior

- **New slash / prefix routing or argument parsing:** `src/presentation/helpers/discord-commands/` (+ specs).
- **Player command side effects** (play, skip, volume, etc.): mostly `src/main/server.ts` today; consider extracting if it grows.
- **Link classification** (YouTube / Spotify / unsupported / search): `src/infra/media-url/` (fully covered). **YouTube adapters**: `src/infra/music/resolve-playable-url.ts`, `youtube-search.ts`, `youtube-audio-resource.ts`.
- **Persist queue/music to backend:** `src/data/usecases/save-queue/`, `save-music/`, and factories under `src/main/factories/usecases/remote/`.
- **HTTP auth / base URL:** `src/main/factories/http/`, `src/main/decorators/authorize-http-client-decorator.ts`.
- **User-visible error strings:** `src/presentation/helpers/discord-errors/`.

## README

Project `README.md` is minimal; treat **this file** and the **source tree** as the practical documentation for agents.
