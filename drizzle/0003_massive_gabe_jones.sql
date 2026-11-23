CREATE TYPE "public"."progress_method" AS ENUM('tasks', 'hours');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "progress_method" "progress_method" DEFAULT 'tasks' NOT NULL;