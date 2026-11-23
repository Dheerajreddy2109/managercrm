# PM Command Center — Module-wise Claude Code Prompts

A single-user project-management web app for a Technical Project Manager.

> **Progress:** Prompts 0–11 are built in this repo (backend, UI, hardening and Vercel deploy config). Nothing pending.
Stack: **Next.js (App Router) · Node route handlers in `app/api/**` · Neon Postgres (Vercel Marketplace) · Drizzle ORM · Tailwind + shadcn/ui · Vercel**

How to use this file:
1. Create an empty folder, open Claude Code in it.
2. Paste **Prompt 0** first. It creates the project and a `CLAUDE.md` so every later prompt shares the same rules.
3. Paste the remaining prompts **one at a time, in order**. Let each finish and run before the next.
4. After each module, run `npm run dev` and click through what was built. Fix before moving on.

---

## Why this stack (decision summary)

| Decision | Choice | Reason |
|---|---|---|
| Database | **Neon Postgres** via Vercel Marketplace | Your data is relational (projects → tasks → members → daily updates). Progress % and "who is free" are joins + aggregates. Postgres does that natively; MongoDB would make you re-implement it in code. Neon is serverless, has a free tier, scales to zero, and `vercel install neon` wires the env vars for you. |
| ORM | **Drizzle** | Tiny bundle, no engine binary, works well with serverless functions, SQL-like so Claude Code writes correct queries. Migrations via `drizzle-kit`. |
| Auth | **Single password + signed cookie (jose)** | Only one user (you). No user table, no OAuth. Password lives in an env var; a middleware protects every page and API route. |
| Backend | **Next.js route handlers in `app/api/**`** | Node runtime, same repo as the frontend, zero extra hosting. |
| UI | **Tailwind + shadcn/ui** | Fast to build dashboards, tables, dialogs, kanban. |
| Hosting | **Vercel** | Git push = deploy. Cron Jobs available for a daily digest later. |

Why not MongoDB: it works on Vercel (Atlas is on the Marketplace too), but every PM feature you asked for is a relational question. Go Postgres.

---

## Feature list (what the app will do)

**Team**
- Member profiles: name, role (Frontend / Backend / QA / DevOps / Design / Other), skills tags, weekly capacity hours, status (active / on leave / inactive).
- Leave calendar per member (date ranges).
- Member page: current projects, open tasks, workload %, daily update history.

**Projects**
- Project: name, client, description, status (planning / active / on hold / completed / cancelled), priority, start date, target end date, health (green / amber / red), tech stack tags.
- Project members (many-to-many) with role on that project and allocation %.
- Milestones per project with due dates.
- Progress % auto-computed from tasks (weighted by estimated hours; falls back to task count).
- Project notes / risks log.

**Tasks**
- Task: title, description, project, milestone (optional), assignee (optional), status (backlog / todo / in_progress / in_review / blocked / done), priority (low / medium / high / urgent), estimated hours, actual hours, due date, tags.
- Kanban board per project + global "My Team's Tasks" table with filters.
- **Assign dialog shows availability**: every member sorted by free hours this week, with a "Free / Light / Busy / Overloaded / On leave" badge, so you pick someone who has room.
- Sub-task checklist and comments per task.
- Activity log (who changed what, when).

**Daily updates (standup log)**
- One entry per member per day: what they worked on (linked tasks), hours logged, blockers, mood/flag.
- "Today" view: which members have / haven't been updated yet, blockers list.
- Logging hours against a task updates its actual hours.

**Dashboard**
- Counters: active projects, tasks due this week, overdue tasks, blocked tasks, members free this week.
- Per-project progress bars + health.
- Team workload heatmap (capacity vs assigned hours).
- Upcoming deadlines (7 / 14 days), overdue list.
- Recent activity feed.

**Reports / Export**
- Weekly summary per project (done / in progress / blocked / next week).
- CSV export of tasks and daily updates.

**Later (optional)**
- Vercel Cron: daily email/Slack digest of blockers and overdue tasks.
- Attachments via Vercel Blob.

---

## Data model (shared by all prompts)

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

Progress % rule: `sum(estimated_hours of done tasks) / sum(estimated_hours of all non-cancelled tasks)`. If no estimates exist, use `done_count / total_count`. Exclude `backlog` from the denominator only if the project setting `count_backlog = false` (default true — keep it simple).

Availability rule (per member, per week): `free_hours = weekly_capacity_hours − leave_hours_this_week − sum(estimated_hours − actual_hours, min 0) of tasks assigned to them that are not done and due within the next 7 days or already in_progress`. Badge: Free ≥ 60 % free · Light 30–60 % · Busy 10–30 % · Overloaded < 10 % · On leave if any leave overlaps today.

---

# PROMPT 0 — Project bootstrap + CLAUDE.md

```
Create a new Next.js 15 project (App Router, TypeScript, Tailwind, ESLint, src/ directory OFF, import alias @/*) in the current folder called "pm-command-center".

Then set up:
1. shadcn/ui (init with default style, neutral base color) and add these components: button, card, dialog, input, textarea, select, badge, table, tabs, progress, avatar, dropdown-menu, sheet, calendar, popover, command, tooltip, separator, skeleton, sonner (toasts), checkbox, label, form.
2. Drizzle ORM for Postgres with Neon: install drizzle-orm, @neondatabase/serverless, drizzle-kit, dotenv. Create:
   - lib/db/index.ts that exports `db` using the neon-http driver and process.env.DATABASE_URL
   - lib/db/schema.ts (empty for now, we fill it in the next prompt)
   - drizzle.config.ts pointing to lib/db/schema.ts, out: ./drizzle, dialect postgresql, using DATABASE_URL_UNPOOLED if present else DATABASE_URL (migrations must use the direct/unpooled connection)
   - package.json scripts: "db:generate": "drizzle-kit generate", "db:migrate": "drizzle-kit migrate", "db:push": "drizzle-kit push", "db:studio": "drizzle-kit studio"
3. Install zod, date-fns, jose, lucide-react.
4. Create .env.example with: DATABASE_URL, DATABASE_URL_UNPOOLED, APP_PASSWORD, SESSION_SECRET (32+ chars), NEXT_PUBLIC_APP_NAME="PM Command Center". Add .env*.local to .gitignore.
5. Folder structure (create with placeholder index files):
   app/api/            -> all backend route handlers live here (Node runtime)
   app/(auth)/login/   -> login page
   app/(dashboard)/    -> all authenticated pages share a layout with a sidebar
   components/ui/      -> shadcn
   components/         -> app components
   lib/db/             -> drizzle
   lib/services/       -> business logic (progress, availability, etc.) — route handlers call services, never raw queries in route files
   lib/validators/     -> zod schemas shared by API and forms
   lib/api.ts          -> helper: `ok(data, status=200)`, `fail(message, status=400)`, `handle(fn)` wrapper that catches ZodError -> 422 and unknown errors -> 500 with consistent JSON `{ ok: boolean, data?, error? }`
6. Write a CLAUDE.md at the repo root with these rules:
   - Single-user app for a Technical Project Manager. No multi-tenant, no user table.
   - Backend = Next.js route handlers under app/api/** using the Node runtime (`export const runtime = "nodejs"`). Response shape is always `{ ok, data }` or `{ ok:false, error }`.
   - Validate every request body with zod schemas from lib/validators. Never trust client input.
   - Business logic lives in lib/services/*. Route handlers are thin.
   - Database: Neon Postgres + Drizzle. Schema in lib/db/schema.ts. After any schema change run `npm run db:generate` then `npm run db:migrate`.
   - Dates stored as `date` or `timestamptz`; the API sends/receives ISO strings.
   - Every write to projects/tasks/members/daily_updates also inserts an activity_log row via lib/services/activity.ts.
   - UI: Tailwind + shadcn/ui, server components by default, client components only when interactive. Use sonner for toasts. Mobile-friendly.
   - Keep files focused; split a file when it passes ~250 lines.
   - Include the data model and the progress/availability rules (I will paste them below in this prompt) verbatim in CLAUDE.md.

[PASTE THE "Data model (shared by all prompts)" SECTION FROM THE MD FILE HERE]

Finish by running `npm run build` to make sure the empty app compiles, and print the final folder tree.
```

---

# PROMPT 1 — Database schema + migrations + seed

```
Implement the full Drizzle schema in lib/db/schema.ts exactly matching the data model in CLAUDE.md.

Requirements:
- Use pgEnum for: member_role, member_status, project_status, project_priority, project_health, milestone_status, task_status, task_priority, note_type, mood (great | ok | struggling).
- UUID primary keys (defaultRandom), created_at/updated_at timestamptz with defaultNow.
- Foreign keys with onDelete: cascade for child rows (task_checklist, task_comments, daily_update_tasks, project_members, milestones, member_leaves, project_notes). tasks.assignee_id and tasks.milestone_id use onDelete: set null.
- Unique index on daily_updates (member_id, date).
- Indexes on tasks(project_id), tasks(assignee_id), tasks(status), tasks(due_date), daily_updates(date), activity_log(created_at).
- Export relations() for every table so we can use db.query.* with `with`.
- Export inferred types: Member, NewMember, Project, NewProject, Task, NewTask, etc.

Then:
1. Run `npm run db:generate` to create the migration SQL and show it to me.
2. Create scripts/seed.ts (run with `tsx`, add "db:seed" script) that inserts: 6 members with different roles and capacities, 3 projects (one active, one planning, one on hold), project memberships, 2 milestones per project, ~25 tasks spread across statuses/assignees with estimated hours and due dates in the past/next 2 weeks, 1 leave for one member this week, and daily updates for the last 5 working days for 4 members. Seed must be idempotent (clear tables first in FK-safe order).
3. Create lib/services/activity.ts with `logActivity(entityType, entityId, action, details)`.
4. Do NOT run migrate yet — I will add DATABASE_URL first. Tell me the exact commands to run after I add the env vars.
```

---

# PROMPT 2 — Single-user authentication

```
Implement single-user auth. There is exactly one user: me. No user table.

1. lib/auth.ts:
   - `createSession()` signs a JWT with jose (HS256, secret = SESSION_SECRET, exp 30 days) and sets it as an httpOnly, secure (in production), sameSite=lax cookie named "pm_session".
   - `verifySession(request?)` returns true/false.
   - `destroySession()`.
   - Compare passwords with a constant-time comparison against process.env.APP_PASSWORD.
2. app/api/auth/login/route.ts (POST { password }) -> 200 + cookie, or 401. Rate-limit naively: after 5 failures from the same IP within 15 minutes return 429 (in-memory Map is fine for a single-user app).
3. app/api/auth/logout/route.ts (POST).
4. middleware.ts at the root: protect everything except /login, /api/auth/*, /_next/*, /favicon.ico, /public assets. Unauthenticated page requests redirect to /login?next=…; unauthenticated /api requests return 401 JSON.
5. app/(auth)/login/page.tsx: centered card, app name, password input, submit, error state, redirects to `next` or /. Use a client component with fetch to /api/auth/login.
6. Add a "Log out" item in the (dashboard) layout sidebar footer (the layout itself is built in Prompt 9; for now create a minimal app/(dashboard)/layout.tsx with a sidebar placeholder and a logout button that calls the API and redirects to /login).
7. Write a short test with vitest (install vitest) for lib/auth.ts: creating and verifying a session round-trips; a tampered token fails.
```

---

# PROMPT 3 — Members API + availability engine

```
Build the Members module backend.

Validators (lib/validators/member.ts): createMemberSchema, updateMemberSchema (partial), createLeaveSchema (start_date <= end_date).

Services:
- lib/services/members.ts: list (with optional filters: status, role, search), getById (with projects via project_members, open tasks count), create, update, remove (soft: set status inactive; hard delete only if ?hard=true and member has no tasks), addLeave, removeLeave.
- lib/services/availability.ts — THIS IS THE CORE FEATURE:
  `getTeamAvailability(weekStart?: Date)` returns for every active member:
    { member, capacity_hours, leave_hours, committed_hours, free_hours, utilization_percent, badge: "free"|"light"|"busy"|"overloaded"|"on_leave", open_tasks: number, projects: [{id,name}] }
  Rules (from CLAUDE.md): committed_hours = sum(max(estimated_hours − actual_hours, 0)) over the member's tasks that are not done AND (status = in_progress OR due_date within [weekStart, weekStart+7d] OR due_date is null and status != backlog). leave_hours = 8 × working days of leave overlapping the week. Badge thresholds: free ≥60% of capacity free, light 30–60, busy 10–30, overloaded <10, on_leave if a leave overlaps today.
  Sort result by free_hours desc. Do this in as few SQL queries as possible (one for tasks aggregated by assignee, one for leaves, one for members) — not N+1.
  Also export `getMemberAvailability(memberId)` reusing the same logic.

Routes (all Node runtime, use handle() wrapper):
- GET/POST            app/api/members/route.ts
- GET/PATCH/DELETE    app/api/members/[id]/route.ts
- GET/POST            app/api/members/[id]/leaves/route.ts
- DELETE              app/api/members/[id]/leaves/[leaveId]/route.ts
- GET                 app/api/availability/route.ts   (?week=YYYY-MM-DD optional)

Log activity on create/update/delete. Add vitest unit tests for availability.ts using an in-memory array of tasks (extract the pure calculation into `computeAvailability(member, tasks, leaves, weekStart)` so it is testable without a DB). Test: member with 40h capacity, 10h committed -> free, badge "free"; member with 38h committed -> overloaded; member on leave today -> on_leave.
```

---

# PROMPT 4 — Projects API + progress calculation

```
Build the Projects module backend.

Validators (lib/validators/project.ts): createProjectSchema, updateProjectSchema, addProjectMemberSchema { member_id, project_role, allocation_percent 0–100 }, createMilestoneSchema, createNoteSchema { type: note|risk|decision, body, severity?: low|medium|high }.

Services:
- lib/services/progress.ts: `computeProjectProgress(tasks)` pure function implementing the CLAUDE.md rule (hours-weighted, fallback to count). Returns { percent, done_tasks, total_tasks, done_hours, total_hours, by_status: {backlog, todo, in_progress, in_review, blocked, done} }. `getProjectProgress(projectId)` and `getAllProjectsProgress()` (one grouped SQL query, not N+1).
- lib/services/projects.ts: list (filters: status, priority, health, search; each row includes progress + member avatars + overdue_count), getById (members, milestones with their own progress, notes, progress, task counts), create, update, archive (status completed/cancelled sets actual_end_date), addMember, updateMember, removeMember, milestones CRUD, notes CRUD.
- Health auto-suggest: `suggestHealth(project, progress)` -> red if overdue tasks > 3 or target_end_date passed and percent < 100; amber if any blocked tasks or behind schedule (percent < expected percent by time elapsed − 15); else green. Store a `health_auto` field in the GET response but keep `health` as the manual override.

Routes:
- GET/POST           app/api/projects/route.ts
- GET/PATCH/DELETE   app/api/projects/[id]/route.ts
- GET                app/api/projects/[id]/progress/route.ts
- GET/POST           app/api/projects/[id]/members/route.ts
- PATCH/DELETE       app/api/projects/[id]/members/[memberId]/route.ts
- GET/POST           app/api/projects/[id]/milestones/route.ts
- PATCH/DELETE       app/api/projects/[id]/milestones/[milestoneId]/route.ts
- GET/POST           app/api/projects/[id]/notes/route.ts
- DELETE             app/api/projects/[id]/notes/[noteId]/route.ts

Vitest tests for computeProjectProgress: all estimated -> weighted; mixed with missing estimates -> count fallback; zero tasks -> 0; and for suggestHealth.
```

---

# PROMPT 5 — Tasks API (CRUD, assign, status flow, comments, checklist)

```
Build the Tasks module backend.

Validators (lib/validators/task.ts): createTaskSchema (title required, project_id required, estimated_hours >= 0, due_date optional ISO date), updateTaskSchema, assignTaskSchema { assignee_id: uuid | null }, moveTaskSchema { status, sort_order }, logHoursSchema { hours > 0 }, checklistItemSchema, commentSchema.

Service lib/services/tasks.ts:
- list(filters: project_id, assignee_id, status[], priority[], due_before, due_after, overdue=true, search, tag, unassigned=true; sort; pagination limit/offset) returning tasks with project {id,name} and assignee {id,name,avatar_color}.
- getById with checklist, comments, project, assignee, milestone, hours logged from daily_update_tasks.
- create: default status todo, sort_order = max+1 within status column.
- update.
- assign(taskId, assigneeId | null): before assigning, call getMemberAvailability and include in the response `{ task, assignee_availability }` plus a `warning` string if the member would become "overloaded" (do not block — I decide).
- move(taskId, status, sort_order): sets started_at when entering in_progress for the first time, completed_at when entering done, clears completed_at when leaving done. Re-index sort_order within the column.
- bulkMove for drag-and-drop reorder: PATCH with array of { id, status, sort_order }.
- logHours(taskId, hours): increments actual_hours (daily updates will also call this).
- checklist add/toggle/remove/reorder; comments add/remove.
- remove.

Routes:
- GET/POST          app/api/tasks/route.ts
- GET/PATCH/DELETE  app/api/tasks/[id]/route.ts
- POST              app/api/tasks/[id]/assign/route.ts
- POST              app/api/tasks/[id]/move/route.ts
- PATCH             app/api/tasks/bulk-move/route.ts
- POST              app/api/tasks/[id]/hours/route.ts
- GET/POST          app/api/tasks/[id]/checklist/route.ts
- PATCH/DELETE      app/api/tasks/[id]/checklist/[itemId]/route.ts
- GET/POST          app/api/tasks/[id]/comments/route.ts
- DELETE            app/api/tasks/[id]/comments/[commentId]/route.ts

Every mutation logs activity with a human-readable `details.message` like "Moved to In Review" or "Assigned to Priya". Add vitest tests for the status-transition timestamps logic (extract into a pure function).
```

---

# PROMPT 6 — Daily updates (standup log) API

```
Build the Daily Updates module backend.

Validator lib/validators/dailyUpdate.ts: upsertDailyUpdateSchema { member_id, date (YYYY-MM-DD), summary, blockers?, hours_logged >= 0, mood?: great|ok|struggling, tasks: [{ task_id, hours >= 0 }] }.

Service lib/services/dailyUpdates.ts:
- upsert(data): insert or update by (member_id, date). Replace daily_update_tasks rows for that update. For each task row, adjust tasks.actual_hours by the delta between old and new hours (so editing an update does not double-count). Wrap in a transaction.
- getForDate(date): returns ALL active members with their update for that date or null, plus `missing_count`, and a flat `blockers` list [{member, blockers, tasks}].
- getForMember(memberId, from, to).
- getRange(from, to) grouped by date for a calendar/heat view.
- remove(id) (reverting actual_hours).
- weeklyDigest(weekStart): per project -> done tasks this week, in progress, blocked, hours logged, members with blockers. Used by reports.

Routes:
- GET  app/api/daily-updates/route.ts          ?date=YYYY-MM-DD  (defaults today)  OR ?from&to
- POST app/api/daily-updates/route.ts          (upsert)
- GET/DELETE app/api/daily-updates/[id]/route.ts
- GET  app/api/members/[id]/daily-updates/route.ts ?from&to
- GET  app/api/reports/weekly/route.ts         ?week=YYYY-MM-DD

Tests: upsert twice with different hours adjusts actual_hours by the delta only.
```

---

# PROMPT 7 — Dashboard + reports + export API

```
Build the Dashboard/Reports backend.

Service lib/services/dashboard.ts:
- getOverview(): { active_projects, planning_projects, on_hold_projects, tasks_due_this_week, overdue_tasks, blocked_tasks, in_progress_tasks, members_free_this_week, members_on_leave_today, updates_missing_today }
- getProjectsSummary(): every non-completed project with progress, health, health_auto, overdue_count, blocked_count, next_milestone, members.
- getWorkloadHeatmap(): reuse availability service; return members × {capacity, committed, free, badge}.
- getUpcomingDeadlines(days=14): tasks + milestones ordered by date, grouped by day.
- getOverdue(): tasks past due_date not done, with days_overdue.
- getActivityFeed(limit=30): activity_log joined with entity names.

Routes:
- GET app/api/dashboard/route.ts  -> one call returning all of the above (run the queries with Promise.all)
- GET app/api/dashboard/activity/route.ts ?limit
- GET app/api/export/tasks/route.ts   -> CSV (Content-Disposition attachment) with filters same as tasks list
- GET app/api/export/daily-updates/route.ts ?from&to -> CSV

Add `export const revalidate = 0` / dynamic = "force-dynamic" so nothing is cached.
Make sure the dashboard route finishes in one DB round-trip per sub-query; print the SQL in dev with drizzle logger to check there is no N+1.
```

---

# PROMPT 8 — Frontend: layout, dashboard, members pages

```
Build the authenticated UI shell and the first two page groups. Server components fetch directly from lib/services (not via HTTP); client components call /api/*.

1. app/(dashboard)/layout.tsx: left sidebar (collapsible on mobile via Sheet) with links: Dashboard, Projects, Tasks, Team, Daily Updates, Reports. Top bar with page title, global "+ New" dropdown (Task / Project / Member / Daily Update), and a command palette (cmd+K) that searches projects, tasks, members via GET /api/search (create a tiny route that queries all three with ILIKE). Logout at the bottom.

2. app/(dashboard)/page.tsx (Dashboard): stat cards from getOverview; "Projects" grid with progress bar, health dot (manual) and auto-health hint; "Team workload" list with capacity bars and badges (Free / Light / Busy / Overloaded / On leave); "Due soon" and "Overdue" lists; "Missing today's update" chips; activity feed.

3. app/(dashboard)/team/page.tsx: table of members (name, role, skills, capacity, utilization bar, badge, open tasks, projects). Filter by role/status, search. "Add member" dialog using a react form with zod resolver (install react-hook-form + @hookform/resolvers).
   app/(dashboard)/team/[id]/page.tsx: header with role/status/capacity, tabs: Overview (availability card, projects, workload), Tasks (table with status filter), Daily Updates (list by date), Leaves (add/remove). Edit member in a Sheet.

4. Shared components in components/: StatusBadge, PriorityBadge, HealthDot, AvailabilityBadge, MemberAvatar (initials + avatar_color), ProgressBar with label, EmptyState, PageHeader, ConfirmDialog, DataTable (TanStack table — install @tanstack/react-table).

Use Suspense + skeletons for loading. Toast on every mutation. Make it look clean and dense like Linear/Height: 14px base, tight spacing, subtle borders.
```

---

# PROMPT 9 — Frontend: projects + kanban + assign-with-availability

```
Build the Projects and Tasks UI.

1. app/(dashboard)/projects/page.tsx: cards or table toggle. Each project: name, client, status, priority, health, progress %, members avatars, overdue count, target date. Filters: status, health, search. "New project" dialog.

2. app/(dashboard)/projects/[id]/page.tsx with tabs:
   - Board: kanban with columns Backlog / To do / In progress / In review / Blocked / Done. Drag & drop between columns using @dnd-kit (install @dnd-kit/core @dnd-kit/sortable). On drop call POST /api/tasks/[id]/move; on reorder call PATCH /api/tasks/bulk-move. Optimistic UI with rollback on error. Card shows title, priority, assignee avatar, due date (red if overdue), estimated/actual hours, checklist progress.
   - List: DataTable of tasks with inline status/priority/assignee change.
   - Milestones: list with per-milestone progress and due date, add/edit/delete.
   - Team: project members with role and allocation %, "Add member" picker that shows availability badge next to each member.
   - Notes & Risks: timeline of notes/risks/decisions with severity.
   - Settings: edit project, change health manually (show auto-suggested health), archive.

3. Task detail: a right-side Sheet (components/tasks/TaskSheet.tsx) opened from any task card/row, URL-synced via ?task=<id>. Shows and edits all fields, checklist, comments, hours log, activity for that task.

4. THE ASSIGN DIALOG (components/tasks/AssignDialog.tsx) — key feature:
   - Fetches GET /api/availability.
   - Lists members sorted by free hours; each row: avatar, name, role, badge (Free/Light/Busy/Overloaded/On leave), capacity bar "committed / capacity h", current projects count. Search box; filter "Only free & light".
   - Selecting a member shows a preview: "After this task: X h free (badge)". Uses the task's remaining estimated hours.
   - Confirm calls POST /api/tasks/[id]/assign and shows the warning from the API if returned.
   - Used from task cards, TaskSheet, and the global Tasks page.

5. app/(dashboard)/tasks/page.tsx: global task table across all projects. Filters: project, assignee, status, priority, due range, overdue, unassigned. Saved quick views: "Overdue", "Unassigned", "Due this week", "Blocked". Bulk select -> assign (opens AssignDialog) or change status. "Export CSV" button hitting /api/export/tasks with current filters.

6. "New task" dialog from the global + menu: project select, title, description, priority, estimate, due date, assignee (via AssignDialog embedded), milestone.
```

---

# PROMPT 10 — Frontend: daily updates + reports

```
Build the Daily Updates and Reports UI.

1. app/(dashboard)/daily-updates/page.tsx: date picker (default today, prev/next day arrows). Two panes:
   - Left: every active member as a card — green check if updated, grey if missing, "On leave" if on leave. Click a card to open the update form.
   - Right / form (components/daily-updates/UpdateForm.tsx): summary textarea, blockers textarea, mood selector, hours logged, task picker (multi-select of that member's open tasks with an hours input each; total auto-fills hours_logged), save -> POST /api/daily-updates (upsert). Show "Also logs hours against tasks" note.
   - Top: "Blockers today" red banner listing all blockers with member + tasks.
   - Week strip above showing each day's completion ratio (e.g. 4/6 updated).

2. app/(dashboard)/reports/page.tsx:
   - Week selector.
   - Per-project weekly card: progress delta vs last week, done tasks, in progress, blocked, hours logged, members with blockers, next milestone. "Copy as Markdown" button that formats the card into a status-update message I can paste into Slack/email.
   - Team utilization table for the week.
   - Export buttons: tasks CSV, daily updates CSV (for the selected week).

3. Add a /api/reports/weekly consumer and make sure all dates use the user's local timezone consistently (store the timezone in an env var APP_TIMEZONE, default "Asia/Kolkata", and use date-fns-tz).
```

---

# PROMPT 11 — Hardening, polish, deploy to Vercel

```
Prepare for production on Vercel.

1. Review every route in app/api/** and confirm: runtime nodejs, zod validation on all inputs, 404 on missing ids, consistent { ok, data | error } shape, no N+1 (use drizzle logger in dev and point out any).
2. Add a global error.tsx and not-found.tsx under app/(dashboard). Add loading.tsx skeletons for each page.
3. Add `npm run typecheck` (tsc --noEmit) and make lint + typecheck + vitest pass. Fix all warnings.
4. Create vercel.json with a cron job hitting GET /api/cron/daily-digest at 09:00 IST (convert to UTC) — implement the route to compute today's blockers + overdue + missing updates and, for now, just store it as a project_notes-style row in a new `digests` table (email/Slack can be added later). Protect the route by checking the `Authorization: Bearer ${CRON_SECRET}` header that Vercel sends.
5. Write README.md with: what the app is, local setup (`vercel install neon` or paste a Neon connection string, copy .env.example to .env.local, `npm run db:migrate`, `npm run db:seed`, `npm run dev`), deploy steps (push to GitHub, import in Vercel, add env vars APP_PASSWORD / SESSION_SECRET / CRON_SECRET / APP_TIMEZONE; DATABASE_URL and DATABASE_URL_UNPOOLED come from the Neon integration), and how migrations run in production (add `"vercel-build": "npm run db:migrate && next build"` to package.json so migrations apply on each deploy using the unpooled URL).
6. Run `npm run build` and confirm a clean build. Print any env vars I must set in the Vercel dashboard.
```

---

## Suggested order and checkpoints

| Step | Prompt | Checkpoint before moving on |
|---|---|---|
| 1 | 0 | `npm run build` passes; CLAUDE.md exists |
| 2 | 1 | Add Neon `DATABASE_URL` + `DATABASE_URL_UNPOOLED` to `.env.local`, run `npm run db:migrate && npm run db:seed`, open `npm run db:studio` and see the data |
| 3 | 2 | Can log in with `APP_PASSWORD`; `/api/members` without login returns 401 |
| 4 | 3 | `curl localhost:3000/api/availability` shows members sorted by free hours with badges |
| 5 | 4 | `/api/projects` shows progress % that matches the seed |
| 6 | 5 | Move a task to done via API and watch the project % change |
| 7 | 6 | Post a daily update and see task actual_hours change |
| 8 | 7 | `/api/dashboard` returns everything in one call |
| 9 | 8–10 | Click through every page |
| 10 | 11 | Deploy, log in on the Vercel URL |

## Getting the Neon database (one time)

```bash
npm i -g vercel
vercel login
vercel link          # from inside the project folder, after Prompt 0
vercel install neon  # creates the Neon DB and pulls DATABASE_URL + DATABASE_URL_UNPOOLED into .env.local
```

Or create a free project at neon.tech, copy the **pooled** connection string into `DATABASE_URL` and the **direct** one into `DATABASE_URL_UNPOOLED`.
