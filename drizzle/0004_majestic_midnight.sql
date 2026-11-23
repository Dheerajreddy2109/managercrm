ALTER TYPE "public"."progress_method" ADD VALUE 'manual' BEFORE 'tasks';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "manual_progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "hold_reason" text;