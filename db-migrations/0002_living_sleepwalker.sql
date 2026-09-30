CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_email" varchar(254) NOT NULL,
	"action" varchar(10) NOT NULL,
	"entity" varchar(20) NOT NULL,
	"entity_id" varchar(254) NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "created_by" varchar(254);--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "updated_by" varchar(254);--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hives" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "created_by" varchar(254);--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "updated_by" varchar(254);--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_desc_idx" ON "audit_logs" USING btree ("created_at" DESC NULLS LAST);