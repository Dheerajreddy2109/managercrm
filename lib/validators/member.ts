import { z } from "zod";
import { MEMBER_ROLES } from "@/lib/db/schema";
import { isoDateSchema } from "./common";

const memberStatus = z.enum(["active", "on_leave", "inactive"]);

export const createMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200).optional().nullable(),
  role: z.enum(MEMBER_ROLES).default("other"),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  weeklyCapacityHours: z.number().int().min(0).max(80).default(40),
  status: memberStatus.default("active"),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  notes: z.string().max(5000).optional().nullable(),
  device: z.string().trim().max(120).optional().nullable(),
  deviceSpecs: z.string().trim().max(300).optional().nullable(),
  deviceIssues: z.string().trim().max(1000).optional().nullable(),
  availableFrom: isoDateSchema.optional().nullable(),
  availableUntil: isoDateSchema.optional().nullable(),
});
export const updateMemberSchema = createMemberSchema.partial();

export const memberListQuerySchema = z.object({
  status: memberStatus.optional(),
  role: z.enum(MEMBER_ROLES).optional(),
  search: z.string().trim().max(100).optional(),
});

export const createLeaveSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    reason: z.string().trim().max(300).optional().nullable(),
  })
  .refine((v) => v.startDate <= v.endDate, { message: "startDate must be on or before endDate", path: ["endDate"] });

export const availabilityQuerySchema = z.object({ week: isoDateSchema.optional() });

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
