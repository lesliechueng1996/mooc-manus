# Mooc Manus

## Overview

Mooc Manus is a pnpm-powered monorepo for building a general-purpose multi-agent platform. A Hono-based API coordinates agent orchestration, storage, and external integrations, while a Next.js front end surfaces agent outputs and controls. Shared domain packages for logging, schemas, database access, and storage keep functionality consistent across services.

## Tech Stack

- **Monorepo & Tooling**: Turborepo, pnpm workspaces, TypeScript, Biome
- **Backend**: Hono (`apps/mooc-manus-api`), `@repo/prisma-database`, `@repo/pino-log`, `@repo/node-redis`, `@repo/tencent-cos`
- **Frontend**: Next.js 16, React 19 (`apps/mooc-manus-ui`)
- **Persistence & Infrastructure**: PostgreSQL, Redis, Prisma ORM, Tencent COS SDK
- **Runtime**: Node.js (>= 18), Docker Compose for local services

## Repository Layout

- `apps/mooc-manus-api`: Hono API service
- `apps/mooc-manus-ui`: Next.js web application
- `packages/api-schema`: Shared API contracts
- `packages/prisma-database`: Prisma client and migration utilities
- `packages/node-redis`: Redis client wrapper
- `packages/tencent-cos`: Tencent Cloud Object Storage utilities
- `packages/pino-log`: Pino-based logging helpers

## Requirements

- Node.js `>= 18`
- pnpm `9.x` (automatic via `packageManager` metadata)
- Docker (optional, for local PostgreSQL and Redis)

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Prepare environment variables**
   - Create `apps/mooc-manus-api/.env` (or export variables) with:
     - `ENV` (default `development`)
     - `LOG_LEVEL` (default `info`)
     - `DATABASE_URL` (default `postgresql://localhost:5432/mooc-manus`)
     - `REDIS_URL` (default `redis://localhost:6379`)
     - `TENCENT_COS_SECRET_ID`, `TENCENT_COS_SECRET_KEY`, `TENCENT_COS_BUCKET`, `TENCENT_COS_REGION`
3. **Start infrastructure (optional)**
   ```bash
   docker compose up -d
   ```
4. **Launch services**
   ```bash
   pnpm dev
   ```
   Turborepo will start both API and UI applications in watch mode.

## Development Scripts

- `pnpm dev` – Run all apps in development mode
- `pnpm build` – Build all packages and apps
- `pnpm lint` – Run Biome checks across the workspace
- `pnpm format` – Auto-format files using Biome
- `pnpm --filter @repo/prisma-database db:migrate` – Apply Prisma migrations

## Troubleshooting

- Ensure Docker containers for PostgreSQL and Redis are running or adjust `DATABASE_URL`/`REDIS_URL`.
- Regenerate Prisma client after schema changes:
  ```bash
  pnpm --filter @repo/prisma-database db:generate
  ```

