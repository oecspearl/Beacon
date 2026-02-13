#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling corepack and pnpm..."
corepack enable
corepack prepare pnpm@9.15.4 --activate

echo "==> Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "==> Building shared packages..."
pnpm --filter @beacon/shared build
pnpm --filter @beacon/protocol build

echo "==> Building dashboard..."
pnpm --filter @beacon/dashboard build

echo "==> Building API..."
pnpm --filter @beacon/api build

echo "==> Build complete!"
