import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const memberRoleEnum = pgEnum("member_role", [
  "frontend", "backend", "fullstack", "qa", "devops", "design", "pm", "other",
]);
export const memberStatusEnum = pgEnum("member_status", ["active", "on_leave", "inactive"]);
export const projectStatusEnum = pgEnum("project_status", [
  "planning", "active", "on_hold", "completed", "cancelled",
]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const projectHealthEnum = pgEnum("project_health", ["green", "amber", "red"]);
export const milestoneStatusEnum = pgEnum("milestone_status", ["open", "done"]);
export const taskStatusEnum = pgEnum("task_status", [
  "backlog", "todo", "in_progress", "in_review", "blocked", "done",
]);
export const noteTypeEnum = pgEnum("note_type", ["note", "risk", "decision"]);
export const severityEnum = pgEnum("severity", ["low", "medium", "high"]);
export const progressMethodEnum = pgEnum("progress_method", ["manual", "tasks", "hours"]);
export const moodEnum = pgEnum("mood", ["great", "ok", "struggling"]);

export const TASK_STATUSES = taskStatusEnum.enumValues;
export const PRIORITIES = priorityEnum.enumValues;
export const MEMBER_ROLES = memberRoleEnum.enumValues;
export const PROJECT_STATUSES = projectStatusEnum.enumValues;

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------- Members ----------
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  role: memberRoleEnum("role").notNull().default("other"),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  weeklyCapacityHours: integer("weekly_capacity_hours").notNull().default(40),
  status: memberStatusEnum("status").notNull().default("active"),
  avatarColor: text("avatar_color").notNull().default("#6366f1"),
  notes: text("notes"),
  device: text("device"),
  deviceSpecs: text("device_specs"),
  deviceIssues: text("device_issues"),
  availableFrom: date("available_from"),
  availableUntil: date("available_until"),
  ...timestamps,
});

export const memberLeaves = pgTable(
  "member_leaves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("member_leaves_member_idx").on(t.memberId), index("member_leaves_dates_idx").on(t.startDate, t.endDate)],
);

// ---------- Projects ----------
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    client: text("client"),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("planning"),
    priority: priorityEnum("priority").notNull().default("medium"),
    health: projectHealthEnum("health").notNull().default("green"),
    startDate: date("start_date"),
    targetEndDate: date("target_end_date"),
    actualEndDate: date("actual_end_date"),
    techStack: text("tech_stack").array().notNull().default(sql`'{}'::text[]`),
    progressMethod: progressMethodEnum("progress_method").notNull().default("manual"),
    manualProgress: integer("manual_progress").notNull().default(0),
    holdReason: text("hold_reason"),
    ...timestamps,
  },
  (t) => [index("projects_status_idx").on(t.status)],
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
    projectRole: text("project_role"),
    allocationPercent: integer("allocation_percent").notNull().default(100),
    // Per-person view of the project (from each employee's sheet tab).
    status: projectStatusEnum("status"),
    priority: priorityEnum("priority"),
    dueDate: date("due_date"),
    progressPercent: integer("progress_percent"),
    tech: text("tech"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.memberId] }), index("project_members_member_idx").on(t.memberId)],
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dueDate: date("due_date"),
    status: milestoneStatusEnum("status").notNull().default("open"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("milestones_project_idx").on(t.projectId)],
);

// ---------- Tasks ----------
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
    assigneeId: uuid("assignee_id").references(() => members.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: priorityEnum("priority").notNull().default("medium"),
    estimatedHours: numeric("estimated_hours", { precision: 7, scale: 2, mode: "number" }).notNull().default(0),
    actualHours: numeric("actual_hours", { precision: 7, scale: 2, mode: "number" }).notNull().default(0),
    dueDate: date("due_date"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("tasks_project_idx").on(t.projectId),
    index("tasks_assignee_idx").on(t.assigneeId),
    index("tasks_status_idx").on(t.status),
    index("tasks_due_date_idx").on(t.dueDate),
    index("tasks_milestone_idx").on(t.milestoneId),
  ],
);

export const taskChecklist = pgTable(
  "task_checklist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isDone: boolean("is_done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("task_checklist_task_idx").on(t.taskId)],
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("task_comments_task_idx").on(t.taskId)],
);

// ---------- Daily updates ----------
export const dailyUpdates = pgTable(
  "daily_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    summary: text("summary").notNull().default(""),
    blockers: text("blockers"),
    hoursLogged: numeric("hours_logged", { precision: 5, scale: 2, mode: "number" }).notNull().default(0),
    mood: moodEnum("mood"),
    ...timestamps,
  },
  (t) => [uniqueIndex("daily_updates_member_date_uq").on(t.memberId, t.date), index("daily_updates_date_idx").on(t.date)],
);

export const dailyUpdateTasks = pgTable(
  "daily_update_tasks",
  {
    dailyUpdateId: uuid("daily_update_id").notNull().references(() => dailyUpdates.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    hours: numeric("hours", { precision: 5, scale: 2, mode: "number" }).notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.dailyUpdateId, t.taskId] }), index("daily_update_tasks_task_idx").on(t.taskId)],
);

// ---------- Notes / activity ----------
export const projectNotes = pgTable(
  "project_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    type: noteTypeEnum("type").notNull().default("note"),
    body: text("body").notNull(),
    severity: severityEnum("severity"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("project_notes_project_idx").on(t.projectId)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_log_created_idx").on(t.createdAt), index("activity_log_entity_idx").on(t.entityType, t.entityId)],
);

/** Cron-built daily digest (blockers + overdue + missing updates). One row per run. */
export const digests = pgTable(
  "digests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("digests_date_idx").on(t.date)],
);

// ---------- Relations ----------
export const membersRelations = relations(members, ({ many }) => ({
  leaves: many(memberLeaves),
  projectMemberships: many(projectMembers),
  tasks: many(tasks),
  dailyUpdates: many(dailyUpdates),
}));

export const memberLeavesRelations = relations(memberLeaves, ({ one }) => ({
  member: one(members, { fields: [memberLeaves.memberId], references: [members.id] }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
  milestones: many(milestones),
  tasks: many(tasks),
  notes: many(projectNotes),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  member: one(members, { fields: [projectMembers.memberId], references: [members.id] }),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  project: one(projects, { fields: [milestones.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  milestone: one(milestones, { fields: [tasks.milestoneId], references: [milestones.id] }),
  assignee: one(members, { fields: [tasks.assigneeId], references: [members.id] }),
  checklist: many(taskChecklist),
  comments: many(taskComments),
  dailyUpdateTasks: many(dailyUpdateTasks),
}));

export const taskChecklistRelations = relations(taskChecklist, ({ one }) => ({
  task: one(tasks, { fields: [taskChecklist.taskId], references: [tasks.id] }),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, { fields: [taskComments.taskId], references: [tasks.id] }),
}));

export const dailyUpdatesRelations = relations(dailyUpdates, ({ one, many }) => ({
  member: one(members, { fields: [dailyUpdates.memberId], references: [members.id] }),
  tasks: many(dailyUpdateTasks),
}));

export const dailyUpdateTasksRelations = relations(dailyUpdateTasks, ({ one }) => ({
  dailyUpdate: one(dailyUpdates, { fields: [dailyUpdateTasks.dailyUpdateId], references: [dailyUpdates.id] }),
  task: one(tasks, { fields: [dailyUpdateTasks.taskId], references: [tasks.id] }),
}));

export const projectNotesRelations = relations(projectNotes, ({ one }) => ({
  project: one(projects, { fields: [projectNotes.projectId], references: [projects.id] }),
}));

// ---------- Inferred types ----------
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type MemberLeave = typeof memberLeaves.$inferSelect;
export type NewMemberLeave = typeof memberLeaves.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskChecklistItem = typeof taskChecklist.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type DailyUpdate = typeof dailyUpdates.$inferSelect;
export type NewDailyUpdate = typeof dailyUpdates.$inferInsert;
export type DailyUpdateTask = typeof dailyUpdateTasks.$inferSelect;
export type ProjectNote = typeof projectNotes.$inferSelect;
export type NewProjectNote = typeof projectNotes.$inferInsert;
export type Digest = typeof digests.$inferSelect;
export type NewDigest = typeof digests.$inferInsert;
export type ActivityLogRow = typeof activityLog.$inferSelect;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type MemberRole = (typeof MEMBER_ROLES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
