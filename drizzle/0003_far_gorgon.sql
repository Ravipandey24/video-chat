ALTER TABLE "users" ADD COLUMN "is_approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approved_at" timestamp;