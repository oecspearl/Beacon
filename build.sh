#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing pnpm..."
npm install -g pnpm@9.15.4

echo "==> Installing dependencies (including devDependencies for build)..."
NODE_ENV=development pnpm install --no-frozen-lockfile

echo "==> Building shared packages..."
pnpm --filter @beacon/shared build
pnpm --filter @beacon/protocol build

echo "==> Building dashboard..."
pnpm --filter @beacon/dashboard build

echo "==> Building API..."
pnpm --filter @beacon/api build

echo "==> Build complete!"
