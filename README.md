# PM Command Center

Single-user project-management app for a Technical Project Manager. Next.js (App Router) · Node route handlers in `app/api/**` · Neon Postgres · Drizzle ORM · shadcn/ui · Vercel.

**Status:** Prompts 0–11 from `docs/claude-code-prompts.md` are done: the full backend, UI, hardening and Vercel deploy config.

## Local setup

1. Get a Neon database (one of):
   - `npm i -g vercel && vercel login && vercel link && vercel install neon` — pulls `DATABASE_URL` and `DATABASE_URL_UNPOOLED` into `.env.local`, or
   - create a project at neon.tech and copy the **pooled** URL into `DATABASE_URL` and the **direct** URL into `DATABASE_URL_UNPOOLED`.
2. `cp .env.example .env.local` and fill in `APP_PASSWORD` and `SESSION_SECRET` (`openssl rand -base64 32`).
3. Apply the schema and seed data:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. `npm run dev` → http://localhost:3000 · `curl localhost:3000/api/health`
5. `npm run db:studio` to browse the tables.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel (framework preset: Next.js).
2. Provision Neon from the Vercel Marketplace (`vercel install neon` locally, or add the integration in the dashboard) — this provides `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. Set these env vars in the Vercel dashboard (Production + Preview):

   | Var | Purpose |
   |---|---|
   | `DATABASE_URL` | Pooled Neon connection (app runtime) |
   | `DATABASE_URL_UNPOOLED` | Direct connection (migrations) |
   | `APP_PASSWORD` | The single login password |
   | `SESSION_SECRET` | JWT signing key, 32+ random chars |
   | `CRON_SECRET` | Bearer token for `/api/cron/*` (`openssl rand -base64 32`) |
   | `APP_TIMEZONE` | Optional, default `Asia/Kolkata` |
   | `NEXT_PUBLIC_APP_NAME` | Optional, default `PM Command Center` |

4. Deploy. Migrations run on every deploy via the `vercel-build` script (`npm run db:migrate && next build`), using `DATABASE_URL_UNPOOLED`.
5. Log in at your `*.vercel.app` URL with `APP_PASSWORD`.

### Cron

`vercel.json` schedules `GET /api/cron/daily-digest` daily at **09:00 IST (03:30 UTC)**. The route builds today's blockers + overdue + missing updates and stores one row per day in the `digests` table. It is protected by `Authorization: Bearer ${CRON_SECRET}` (constant-time compare); local test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/daily-digest
```

## Scripts

| Script | What |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` · `npm run lint` · `npm test` | Quality gates (vitest) |
| `npm run db:generate` | Create a migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (uses the unpooled URL) |
| `npm run db:push` | Push schema without a migration file (dev only) |
| `npm run db:seed` | Idempotent demo data: 6 members, 3 projects, 26 tasks, 5 days of updates |

## Layout

```
app/api/**          backend route handlers (Node runtime)
app/(auth)/login    login page (Prompt 2)
app/(dashboard)/    authenticated pages (Prompt 8+)
lib/db/             drizzle client + schema
lib/services/       business logic (progress, availability, …)
lib/validators/     zod schemas shared by API and forms
lib/api.ts          ok() / fail() / handle() response helpers
drizzle/            generated SQL migrations
scripts/seed.ts     seed data
docs/               module-wise Claude Code prompts
```

See `CLAUDE.md` for the data model, business rules and coding conventions.
