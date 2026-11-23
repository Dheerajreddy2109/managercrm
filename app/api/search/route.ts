import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { globalSearch } from "@/lib/services/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ q: z.string().trim().max(100).default("") });

export const GET = handle(async (req) => ok(await globalSearch(schema.parse(queryObject(req)).q)));
