# Agent guide: discord-bot-player

This document orients coding agents and contributors to how the repo is organized, how to run it, and where to make changes safely.

## What this project is

A **Node.js Discord bot** that plays music using [`@rafateoli/discord-music-player`](https://www.npmjs.com/package/@rafateoli/discord-music-player) on top of **discord.js v14**. It handles prefix commands, slash/button-style interactions, voice channels, and syncs **queue** and **now playing** state to a remote HTTP API and optionally **RabbitMQ**.

Entry point: `src/main/server.ts`.

## Requirements

- **Node.js ≥ 22** (see `package.json` → `engines`)
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
- **@rafateoli/discord-music-player** — `Player`, queues, events (`songAdd`, `queueEnd`, etc.).
- **play-dl** — indirect / peer usage typical of DMP stacks for sources.
- **amqplib** — optional queue fan-out.
- **isomorphic-unfetch** — HTTP from data layer implementations.

## Where to change behavior

- **New slash / prefix routing or argument parsing:** `src/presentation/helpers/discord-commands/` (+ specs).
- **Player command side effects** (play, skip, volume, etc.): mostly `src/main/server.ts` today; consider extracting if it grows.
- **Persist queue/music to backend:** `src/data/usecases/save-queue/`, `save-music/`, and factories under `src/main/factories/usecases/remote/`.
- **HTTP auth / base URL:** `src/main/factories/http/`, `src/main/decorators/authorize-http-client-decorator.ts`.
- **User-visible error strings:** `src/presentation/helpers/discord-errors/`.

## README

Project `README.md` is minimal; treat **this file** and the **source tree** as the practical documentation for agents.
