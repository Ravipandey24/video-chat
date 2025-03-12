CREATE TABLE "frame_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"frame_url" text NOT NULL,
	"description" text NOT NULL,
	"position" integer NOT NULL,
	"video_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "frame_analyses" ADD CONSTRAINT "frame_analyses_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;