FROM node:20-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY tsconfig.base.json ./

# Copy package manifests for all workspace packages
COPY packages/shared/package.json packages/shared/
COPY packages/protocol/package.json packages/protocol/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/protocol/ packages/protocol/
COPY apps/api/ apps/api/

# Build shared packages first, then the API
RUN pnpm --filter @beacon/shared build && \
    pnpm --filter @beacon/protocol build && \
    pnpm --filter @beacon/api build

EXPOSE 3001

# Run with tsx for development (hot-reload with mounted volumes)
# For production, use: CMD ["node", "apps/api/dist/index.js"]
CMD ["pnpm", "--filter", "@beacon/api", "dev"]
