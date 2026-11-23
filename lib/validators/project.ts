import { z } from "zod";
import { PRIORITIES, PROJECT_STATUSES } from "@/lib/db/schema";
import { isoDateSchema, uuidSchema } from "./common";

export const healthSchema = z.enum(["green", "amber", "red"]);

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    client: z.string().trim().max(160).optional().nullable(),
    description: z.string().max(10000).optional().nullable(),
    status: z.enum(PROJECT_STATUSES).default("planning"),
    priority: z.enum(PRIORITIES).default("medium"),
    health: healthSchema.default("green"),
    startDate: isoDateSchema.optional().nullable(),
    targetEndDate: isoDateSchema.optional().nullable(),
    techStack: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
    progressMethod: z.enum(["manual", "tasks", "hours"]).default("manual"),
    manualProgress: z.number().int().min(0).max(100).default(0),
    holdReason: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((v) => !v.startDate || !v.targetEndDate || v.startDate <= v.targetEndDate, {
    message: "targetEndDate must be on or after startDate",
    path: ["targetEndDate"],
  });
export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  client: z.string().trim().max(160).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  health: healthSchema.optional(),
  startDate: isoDateSchema.optional().nullable(),
  targetEndDate: isoDateSchema.optional().nullable(),
  actualEndDate: isoDateSchema.optional().nullable(),
  techStack: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  progressMethod: z.enum(["manual", "tasks", "hours"]).optional(),
  manualProgress: z.number().int().min(0).max(100).optional(),
  holdReason: z.string().trim().max(1000).optional().nullable(),
  /** Only used when status changes to completed: mark every open task Done. */
  markOpenTasksDone: z.boolean().optional(),
});

export const projectListQuerySchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  health: healthSchema.optional(),
  search: z.string().trim().max(100).optional(),
  includeClosed: z.enum(["true", "false"]).optional(),
});

export const addProjectMemberSchema = z.object({
  memberId: uuidSchema,
  projectRole: z.string().trim().max(80).optional().nullable(),
  allocationPercent: z.number().int().min(0).max(100).default(100),
  status: z.enum(PROJECT_STATUSES).optional().nullable(),
  priority: z.enum(PRIORITIES).optional().nullable(),
  dueDate: isoDateSchema.optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
  tech: z.string().trim().max(80).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export const updateProjectMemberSchema = addProjectMemberSchema.omit({ memberId: true }).partial();

export const createMilestoneSchema = z.object({
  name: z.string().trim().min(1).max(160),
  dueDate: isoDateSchema.optional().nullable(),
  status: z.enum(["open", "done"]).default("open"),
  sortOrder: z.number().int().min(0).optional(),
});
export const updateMilestoneSchema = createMilestoneSchema.partial();

export const createNoteSchema = z.object({
  type: z.enum(["note", "risk", "decision"]).default("note"),
  body: z.string().trim().min(1).max(10000),
  severity: z.enum(["low", "medium", "high"]).optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
