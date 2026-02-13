FROM node:20-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY tsconfig.base.json ./

# Copy package manifests for all workspace packages
COPY packages/shared/package.json packages/shared/
COPY apps/dashboard/package.json apps/dashboard/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/dashboard/ apps/dashboard/

# Build shared package
RUN pnpm --filter @beacon/shared build

EXPOSE 5173

# Run Vite dev server (listens on all interfaces for Docker)
CMD ["pnpm", "--filter", "@beacon/dashboard", "dev", "--", "--host", "0.0.0.0"]
