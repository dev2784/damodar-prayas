# Damodar Prayas

Darzi Samaj community and matrimony platform.

Primary language: Hindi. Optional language: English.

## Initial modules

- Matrimony
- Community posts
- Samiti information

## Tech stack

- Mobile: React Native / Expo
- Admin: Next.js
- API: Node.js + Fastify + TypeScript
- Database: Neon PostgreSQL
- ORM: Prisma
- Workspace: pnpm

## Repository layout

```text
apps/
  api/
  admin/      # next phase
  mobile/     # next phase
packages/
  shared/
prisma/
  schema.prisma
```

## Current backend foundation

- Fastify application shell
- Environment validation with Zod
- Prisma client singleton
- Neon database readiness check
- CORS configuration
- JWT plugin foundation
- Auth route skeleton
- Graceful shutdown

### Available API routes

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/ready`
- `POST /api/v1/auth/request-otp`
- `POST /api/v1/auth/verify-otp`
- `GET /api/v1/auth/me`

OTP endpoints intentionally return `501` until an SMS/OTP provider is connected.

## Local setup

```bash
git clone https://github.com/dev2784/damodar-prayas.git
cd damodar-prayas
corepack enable
pnpm install
cp .env.example .env
```

Add your Neon `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters to `.env`, then run:

```bash
pnpm prisma:generate
pnpm dev
```

API default URL: `http://localhost:4000`

Database readiness check: `http://localhost:4000/api/v1/ready`

Never commit `.env` or production secrets.
