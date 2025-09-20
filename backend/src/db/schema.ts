import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  Article,
  EnhancedResearchData,
  ResearchRequest,
  WorkflowLog,
} from "../types";

type RequestStatus = ResearchRequest["status"];

type WorkflowStatus = WorkflowLog["status"];

export const researchRequests = pgTable("research_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  topic: varchar("topic", { length: 255 }).notNull(),
  userId: uuid("user_id").notNull().defaultRandom(),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("pending")
    .$type<RequestStatus>(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const researchResults = pgTable("research_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => researchRequests.id, { onDelete: "cascade" }),
  articles: jsonb("articles").notNull().$type<Article[]>(),
  keywords: text("keywords").array().notNull().$type<string[]>(),
  enhancedData: jsonb("enhanced_data").$type<EnhancedResearchData | null>(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const workflowLogs = pgTable("workflow_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => researchRequests.id, { onDelete: "cascade" }),
  step: varchar("step", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<WorkflowStatus>(),
  message: text("message"),
  timestamp: timestamp("timestamp", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export type ResearchRequestRow = typeof researchRequests.$inferSelect;
export type ResearchRequestInsert = typeof researchRequests.$inferInsert;

export type ResearchResultRow = typeof researchResults.$inferSelect;
export type ResearchResultInsert = typeof researchResults.$inferInsert;

export type WorkflowLogRow = typeof workflowLogs.$inferSelect;
export type WorkflowLogInsert = typeof workflowLogs.$inferInsert;
