import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./common";

export const upsertDailyUpdateSchema = z.object({
  memberId: uuidSchema,
  date: isoDateSchema,
  summary: z.string().trim().max(10000).default(""),
  blockers: z.string().trim().max(10000).optional().nullable(),
  hoursLogged: z.number().min(0).max(24).optional(),
  mood: z.enum(["great", "ok", "struggling"]).optional().nullable(),
  tasks: z.array(z.object({ taskId: uuidSchema, hours: z.number().min(0).max(24) })).max(50).default([]),
});

export const dailyUpdatesQuerySchema = z
  .object({
    date: isoDateSchema.optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((q) => !(q.from && !q.to) && !(!q.from && q.to), { message: "from and to must be given together" });

export const memberUpdatesQuerySchema = z.object({ from: isoDateSchema, to: isoDateSchema }).refine((q) => q.from <= q.to, { message: "from must be <= to" });
export const weekQuerySchema = z.object({ week: isoDateSchema.optional() });

export type UpsertDailyUpdateInput = z.infer<typeof upsertDailyUpdateSchema>;
