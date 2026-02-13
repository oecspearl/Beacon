# Beacon — Development Guide

## Project Structure
This is a pnpm monorepo with three apps and two shared packages:

```
apps/
  mobile/      — React Native (Expo) mobile app
  api/         — Node.js + Express + TypeScript backend
  dashboard/   — React + Vite + TypeScript coordination dashboard
packages/
  shared/      — Shared types, constants, Zod schemas
  protocol/    — BLE mesh protocol, SMS encoding/decoding, message queue
```

## Key Commands
- `pnpm install` — Install all dependencies
- `pnpm dev:api` — Start API server in dev mode
- `pnpm dev:dashboard` — Start dashboard dev server
- `pnpm mobile start` — Start Expo dev server for mobile
- `pnpm build:shared && pnpm build:protocol` — Build shared packages (must run before other builds)

## Tech Stack
- **Mobile**: Expo SDK 52, React Native 0.76, Expo Router, Zustand, expo-sqlite, expo-location, react-native-ble-plx
- **API**: Express 4, Drizzle ORM, PostgreSQL + PostGIS, Socket.IO, Pino, Zod, JWT auth
- **Dashboard**: React 18, Vite 6, Tailwind CSS 3, Leaflet, Socket.IO Client, Zustand, React Router 7
- **Shared**: TypeScript, Zod schemas

## Database
- PostgreSQL with PostGIS extension
- Drizzle ORM with Drizzle Kit for migrations
- Run `pnpm api db:generate` then `pnpm api db:migrate` for schema changes

## Design System
- Mobile: Dark theme (#1a1a2e background, #16213e cards, #3b82f6 accent)
- Dashboard: Tailwind dark theme (slate-800/900, custom beacon/status color palette)
- Status colors: safe=#22c55e, moving=#f59e0b, assistance=#f97316, urgent=#ef4444, overdue=#6b7280, lost=#111827

## Offline-First Architecture
- All critical functionality must work with zero connectivity
- SMS encoding: `BCN|<student_id>|<lat>,<lon>|<status>|<timestamp>` (160 char limit)
- Message queue with priority: Panic(0) > Status(1) > CheckIn(2) > Message(3) > Telemetry(4)
- Channel priority: Data > Mesh > SMS > Satellite
