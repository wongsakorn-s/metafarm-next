CREATE TABLE "harvests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"hive_id" uuid NOT NULL,
	"harvested_at" date NOT NULL,
	"honey_ml" integer DEFAULT 0 NOT NULL,
	"propolis_g" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hives" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(100) NOT NULL,
	"species" varchar(100),
	"location" varchar(200),
	"status" varchar(10) DEFAULT 'Normal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hives_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"hive_id" uuid NOT NULL,
	"inspected_at" date NOT NULL,
	"notes" text,
	"status" varchar(10) NOT NULL,
	"image_key" text,
	"image_mime" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"email" varchar(254) PRIMARY KEY NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_hive_id_hives_id_fk" FOREIGN KEY ("hive_id") REFERENCES "public"."hives"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_hive_id_hives_id_fk" FOREIGN KEY ("hive_id") REFERENCES "public"."hives"("id") ON DELETE restrict ON UPDATE no action;