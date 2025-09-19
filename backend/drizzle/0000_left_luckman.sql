CREATE TABLE "research_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"articles" jsonb NOT NULL,
	"keywords" text[] NOT NULL,
	"enhanced_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"step" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"message" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_results" ADD CONSTRAINT "research_results_request_id_research_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."research_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_request_id_research_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."research_requests"("id") ON DELETE cascade ON UPDATE no action;