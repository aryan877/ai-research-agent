import * as schema from "../db/schema";

describe("Database Schema", () => {
  describe("Schema exports", () => {
    it("should export required tables", () => {
      expect(schema.researchRequests).toBeDefined();
      expect(schema.researchResults).toBeDefined();
      expect(schema.workflowLogs).toBeDefined();
    });

    it("should export type definitions", () => {
      // Types are exported and available at runtime via typeof
      expect(typeof schema.researchRequests.$inferSelect).toBe("object");
      expect(typeof schema.researchRequests.$inferInsert).toBe("object");
      expect(typeof schema.researchResults.$inferSelect).toBe("object");
      expect(typeof schema.researchResults.$inferInsert).toBe("object");
      expect(typeof schema.workflowLogs.$inferSelect).toBe("object");
      expect(typeof schema.workflowLogs.$inferInsert).toBe("object");
    });
  });

  describe("Table structure", () => {
    it("should have correct research_requests columns", () => {
      const table = schema.researchRequests;
      expect(table).toBeDefined();

      // Check if table has the expected structure
      expect(table.id).toBeDefined();
      expect(table.topic).toBeDefined();
      expect(table.status).toBeDefined();
      expect(table.createdAt).toBeDefined();
      expect(table.updatedAt).toBeDefined();
    });

    it("should have correct research_results columns", () => {
      const table = schema.researchResults;
      expect(table).toBeDefined();

      expect(table.id).toBeDefined();
      expect(table.requestId).toBeDefined();
      expect(table.articles).toBeDefined();
      expect(table.keywords).toBeDefined();
      expect(table.enhancedData).toBeDefined();
      expect(table.createdAt).toBeDefined();
    });

    it("should have correct workflow_logs columns", () => {
      const table = schema.workflowLogs;
      expect(table).toBeDefined();

      expect(table.id).toBeDefined();
      expect(table.requestId).toBeDefined();
      expect(table.step).toBeDefined();
      expect(table.status).toBeDefined();
      expect(table.message).toBeDefined();
      expect(table.timestamp).toBeDefined();
    });
  });
});
