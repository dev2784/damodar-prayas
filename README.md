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
  admin/
  mobile/
packages/
  shared/
prisma/
  schema.prisma
```

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env`.
3. Put the Neon `DATABASE_URL` in `.env`.
4. Run `pnpm prisma:generate`.
5. Start the API with `pnpm dev:api`.

Never commit `.env` or production secrets.
