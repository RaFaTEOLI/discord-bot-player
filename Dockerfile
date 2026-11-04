# Production dependencies, built on the full image so native modules (@discordjs/opus) can compile
# if no prebuilt binary is available.
FROM node:24-bookworm AS deps
WORKDIR /app
COPY package.json yarn.lock ./
# `prepare` installs husky git hooks, which are dev-only and need a git checkout.
RUN npm pkg delete scripts.prepare \
  && yarn install --frozen-lockfile --production --network-timeout 600000

FROM deps AS build
RUN yarn install --frozen-lockfile --network-timeout 600000
COPY tsconfig.json tsconfig-build.json ./
COPY src ./src
RUN yarn build

# Same Debian release as the build stages, so native binaries stay ABI-compatible.
FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main/server.js"]
