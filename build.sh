#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
npm install -g pnpm@9.15.4
pnpm install --frozen-lockfile || pnpm install

echo "==> Building shared packages..."
pnpm --filter @beacon/shared build
pnpm --filter @beacon/protocol build

echo "==> Building dashboard..."
pnpm --filter @beacon/dashboard build

echo "==> Building API..."
pnpm --filter @beacon/api build

echo "==> Pushing database schema..."
cd apps/api && npx drizzle-kit push --force && cd ../..

echo "==> Build complete!"
