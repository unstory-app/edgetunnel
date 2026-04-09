FROM node:22-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN corepack enable && corepack prepare bun@1.3.0 --activate
RUN bun install

COPY apps/backend ./apps/backend
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/config ./packages/config

RUN bun --cwd apps/backend run build

FROM node:22-alpine
WORKDIR /app
COPY --from=base /app/apps/backend/dist ./dist
COPY --from=base /app/apps/backend/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
EXPOSE 8080
CMD ["node", "dist/index.js"]
