ALTER TABLE "research_requests" ADD COLUMN "user_id" uuid NOT NULL DEFAULT gen_random_uuid();
