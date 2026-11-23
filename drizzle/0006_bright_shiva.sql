ALTER TABLE "project_members" ADD COLUMN "status" "project_status";--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "priority" "priority";--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "progress_percent" integer;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "tech" text;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "notes" text;