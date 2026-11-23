import { z } from "zod";
import { PRIORITIES, TASK_STATUSES } from "@/lib/db/schema";
import { boolParam, csvList, isoDateSchema, uuidSchema } from "./common";

const hours = z.number().min(0).max(10000);

export const createTaskSchema = z.object({
  projectId: uuidSchema,
  milestoneId: uuidSchema.optional().nullable(),
  assigneeId: uuidSchema.optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(20000).optional().nullable(),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(PRIORITIES).default("medium"),
  estimatedHours: hours.default(0),
  dueDate: isoDateSchema.optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const updateTaskSchema = z.object({
  milestoneId: uuidSchema.optional().nullable(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(20000).optional().nullable(),
  priority: z.enum(PRIORITIES).optional(),
  estimatedHours: hours.optional(),
  actualHours: hours.optional(),
  dueDate: isoDateSchema.optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  // status/assignee changes go through /move and /assign so timestamps + activity stay correct
});

export const assignTaskSchema = z.object({ assigneeId: uuidSchema.nullable() });

export const moveTaskSchema = z.object({
  status: z.enum(TASK_STATUSES),
  sortOrder: z.number().int().min(0).optional(),
});

export const bulkMoveSchema = z.object({
  items: z.array(z.object({ id: uuidSchema, status: z.enum(TASK_STATUSES), sortOrder: z.number().int().min(0) })).min(1).max(500),
});

export const logHoursSchema = z.object({ hours: z.number().gt(0).max(1000) });

export const checklistItemSchema = z.object({ text: z.string().trim().min(1).max(300) });
export const updateChecklistItemSchema = z.object({
  text: z.string().trim().min(1).max(300).optional(),
  isDone: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export const commentSchema = z.object({ body: z.string().trim().min(1).max(10000) });

export const taskListQuerySchema = z.object({
  projectId: uuidSchema.optional(),
  assigneeId: uuidSchema.optional(),
  milestoneId: uuidSchema.optional(),
  status: csvList(z.enum(TASK_STATUSES)).optional(),
  priority: csvList(z.enum(PRIORITIES)).optional(),
  dueBefore: isoDateSchema.optional(),
  dueAfter: isoDateSchema.optional(),
  overdue: boolParam.optional(),
  unassigned: boolParam.optional(),
  includeDone: boolParam.optional(),
  search: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(40).optional(),
  sort: z.enum(["dueDate", "priority", "createdAt", "updatedAt", "title", "sortOrder"]).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type BulkMoveInput = z.infer<typeof bulkMoveSchema>;
