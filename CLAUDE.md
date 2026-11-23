# PM Command Center — project rules for Claude Code

Single-user project-management app for a Technical Project Manager. One user (the PM). No multi-tenant, no user table.

## Stack
- Next.js (App Router, TypeScript), Tailwind v4, shadcn/ui (`components/ui`), lucide-react icons, sonner toasts.
- Backend = Next.js route handlers under `app/api/**`, Node runtime (`export const runtime = "nodejs"`), `export const dynamic = "force-dynamic"`.
- Database: Neon Postgres + Drizzle ORM (`lib/db/schema.ts`, client in `lib/db/index.ts`, neon-http driver).
- Validation: zod schemas in `lib/validators/*`, shared by API routes and forms.
- Auth: single password (`APP_PASSWORD`) + signed JWT cookie (`jose`, `SESSION_SECRET`). `middleware.ts` guards every page and `/api/*` except `/login` and `/api/auth/*`.

## Rules
- API responses are ALWAYS `{ ok: true, data }` or `{ ok: false, error, issues? }`. Use `ok()`, `fail()`, `handle()`, `readJson()`, `HttpError`, `notFound()` from `lib/api.ts`.
- Validate every request body / query with zod. Never trust client input.
- Business logic lives in `lib/services/*`. Route handlers are thin: parse → validate → call service → `ok()`.
- Server components fetch via services directly (no HTTP to self). Client components call `/api/*`.
- Every write to members / projects / tasks / daily_updates also inserts an `activity_log` row via `logActivity()` in `lib/services/activity.ts`.
- No N+1 queries: aggregate in SQL (`GROUP BY`) or use `db.query.*` with `with`.
- Dates: `date` columns for calendar dates (YYYY-MM-DD strings), `timestamptz` for instants. API sends/receives ISO strings. App timezone = `APP_TIMEZONE` (default Asia/Kolkata).
- After any schema change: `npm run db:generate` then `npm run db:migrate` (migrations use `DATABASE_URL_UNPOOLED`).
- UI: server components by default; `"use client"` only when interactive. Dense, clean (Linear-like). Mobile friendly. Toast on every mutation.
- Keep files focused; split when a file passes ~250 lines.
- Tests: vitest (`npm test`). Put pure calculation logic (progress, availability, status transitions) in pure functions and unit-test them.

## Scripts
`npm run dev` · `npm run build` · `npm run typecheck` · `npm test` · `npm run db:generate` · `npm run db:migrate` · `npm run db:push` · `npm run db:studio` · `npm run db:seed`

## Data model
```
members            id, name, email, role, skills(text[]), weekly_capacity_hours (default 40),
                   status, avatar_color, notes, created_at, updated_at
member_leaves      id, member_id, start_date, end_date, reason
projects           id, name, client, description, status, priority, health, start_date,
                   target_end_date, actual_end_date, tech_stack(text[]), created_at, updated_at
project_members    project_id, member_id, project_role, allocation_percent   (composite PK)
milestones         id, project_id, name, due_date, status, sort_order
tasks              id, project_id, milestone_id?, assignee_id?, title, description, status,
                   priority, estimated_hours, actual_hours, due_date, started_at, completed_at,
                   tags(text[]), sort_order, created_at, updated_at
task_checklist     id, task_id, text, is_done, sort_order
task_comments      id, task_id, body, created_at
daily_updates      id, member_id, date, summary, blockers, hours_logged, mood,
                   created_at, updated_at                       (unique member_id+date)
daily_update_tasks daily_update_id, task_id, hours             (composite PK)
project_notes      id, project_id, type (note|risk|decision), body, severity?, created_at
activity_log       id, entity_type, entity_id, action, details(jsonb), created_at
```

Enums: member_role (frontend|backend|fullstack|qa|devops|design|pm|other), member_status (active|on_leave|inactive),
project_status (planning|active|on_hold|completed|cancelled), project_priority / task_priority (low|medium|high|urgent),
project_health (green|amber|red), milestone_status (open|done), task_status (backlog|todo|in_progress|in_review|blocked|done),
note_type (note|risk|decision), severity (low|medium|high), mood (great|ok|struggling).

## Business rules
**Project progress %** depends on `projects.progress_method`: `tasks` (default) = `done_count / total_count`; `hours` = `sum(estimated_hours of done tasks) / sum(estimated_hours of all tasks)`, falling back to count if no task has an estimate. Backlog tasks count in the denominator. Zero tasks → 0 %.

**Availability (per member, per week starting Monday)**
`committed_hours = Σ max(estimated_hours − actual_hours, 0)` over the member's tasks that are not done AND (status = in_progress OR due_date within [weekStart, weekStart+7d) OR (due_date is null AND status ≠ backlog)).
`leave_hours = 8 × working days (Mon–Fri) of leave overlapping the week`.
`free_hours = max(weekly_capacity_hours − leave_hours − committed_hours, 0)`.
Badge by `free_hours / weekly_capacity_hours`: **free** ≥ 0.60 · **light** 0.30–0.60 · **busy** 0.10–0.30 · **overloaded** < 0.10 · **on_leave** if any leave overlaps today (overrides others).

**Task status transitions**: entering `in_progress` for the first time sets `started_at`; entering `done` sets `completed_at`; leaving `done` clears `completed_at`.

**Daily update hours**: editing an update adjusts each task's `actual_hours` by the delta vs the previous value (never double-count).

**Auto health suggestion**: red if overdue tasks > 3, or target_end_date passed with progress < 100; amber if any blocked tasks or progress < (expected % by elapsed time − 15); else green. Manual `health` always wins; `health_auto` is advisory.
