# Member support

## Access

Mobile Home (below the committee banner) and Profile > My services both link to **Help & contact / सहायता और संपर्क**. The existing five bottom tabs remain unchanged. Guests see a login prompt; login returns to the support screen.

The bilingual form asks only for category (feedback, complaint, contact/question), subject, and message. Names and contact details come from the authenticated User relation on the server, never from submission payloads. Success shows a reference number. This is an inbox, not live chat; it does not promise an immediate response or send email/SMS automatically.

Admin sidebar > **Feedback & Complaints** (`/support`) lists messages newest first, with name, phone, email, user ID, date, reference and complete text. Filter by category/status and paginate. Administrators can set New, In progress, Resolved and keep a private note. Status/note changes are audit-logged. Notes are not sent to members. Deleted accounts have no contact details exposed.

## API and deployment

- `POST /api/v1/support`: active authenticated member; category, subject (3–120 characters), message (10–4000 characters). Rejects extra fields such as forged userId/status.
- `GET /api/v1/admin/support`: active ADMIN/SUPER_ADMIN only, optional status/category, page and limit.
- `PATCH /api/v1/admin/support/:id`: active ADMIN/SUPER_ADMIN only; status and adminNote.
- Apply migration `20260926180000_support_tickets` before deploying this API; regenerate Prisma client (`pnpm --dir apps/api prisma:generate`). Existing Render build already runs migrations and generation. No live migration was run during this change.

## Checks

API tests use Fastify injection with mocked DB methods to verify guest/inactive-member rejection, server-owned identity, strict inputs, admin-only reads/writes, pagination/filtering, deleted-account handling and audit updates. Run `pnpm --dir apps/api build` then `pnpm --dir apps/api test`.

API build and 7 API tests passed. Mobile/admin TypeScript checks, targeted mobile ESLint, Expo web export and Next.js production build passed. Before release, test on a phone: guest login return, each form category, success/error states, double tap prevention, keyboard behavior and language changes. In the admin portal, check a real test submission and update its status/note. No native-device or live-database test has been performed in this environment.
