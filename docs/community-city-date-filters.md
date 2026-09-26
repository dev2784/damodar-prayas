# Community city and date filters

Mobile News, Events, Obituaries and Ads now accept a city and selected calendar date, and can filter by either or both. Default: all cities/dates, newest `createdAt` first (ID breaks ties), with pagination. Approval, deletion and expiry rules are unchanged. Hindi/English controls follow the app setting; user-authored content falls back to its available language.

## Dates and locations

- News/ads: chosen date (today in India initially).
- Events: event date. Death notices: death date. Other obituary notices: ceremony date.
- `postDate` is a PostgreSQL DATE; requests use `YYYY-MM-DD`. India calendar days are used for legacy timestamp conversion.
- State is currently Madhya Pradesh. City selection uses stable IDs from the 420 MP urban local bodies/cantonments in the official PMAY list, downloaded on 2026-09-26: https://pmay-urban.gov.in/uploads/List-of-ULB.pdf. Planning areas/villages are excluded. Names and district labels retain the directory's English spelling; picker searches both.
- Address/venue remains a separate optional field. Identically named cities are distinguished by district and ID.
- The migration fills legacy dates and matches unambiguous city names at the start of comma-separated locations. Other old addresses remain under All cities; we do not guess their city. Old client requests remain accepted.

## Deployment

Deploy the API and apply `20260926090000_community_city_date` before releasing the mobile build. The existing Render build command already runs Prisma migrations and generates the API client. No production migration was run during development. Generated Prisma output is not included in this change; regenerate locally before API checks.

## Verification

```
pnpm --dir apps/api build
pnpm --dir apps/api test
pnpm --dir apps/mobile typecheck
pnpm --dir apps/mobile exec eslint src/features/community/selectors.tsx src/app/community.tsx src/app/community-submit.tsx src/app/community-post.tsx src/services/community-api.ts
pnpm --dir apps/mobile exec expo export --platform web
```

API tests cover date/city validation, legacy compatibility, India midnight boundaries, all four categories, combined filters, matching pagination counts, newest-first order, translation fallback, and saving submissions in PENDING status. Tests use mocked database methods through Fastify injection, not a live database.

Device smoke check before release: select a city and date for each category, submit/approve a test post, filter it by city/date, clear filters, change language, paginate, and dismiss/reopen the calendar. Native Android/iOS interaction has not been exercised in this environment.
