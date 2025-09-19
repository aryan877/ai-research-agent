import { ResearchRequestModel } from "../../models/ResearchRequest";

// Mock the database module
jest.mock("../../utils/database", () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([
      {
        id: "test-id",
        topic: "AI trends",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([
      {
        id: "test-id",
        topic: "AI trends",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    orderBy: jest.fn().mockResolvedValue([
      {
        id: "test-id",
        topic: "AI trends",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}));

describe("ResearchRequestModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new research request", async () => {
      const topic = "AI trends in 2025";
      const result = await ResearchRequestModel.create(topic);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("topic", "AI trends");
      expect(result).toHaveProperty("status", "pending");
    });
  });

  describe("findById", () => {
    it("should find research request by id", async () => {
      const result = await ResearchRequestModel.findById("test-id");

      expect(result).toHaveProperty("id", "test-id");
      expect(result).toHaveProperty("topic", "AI trends");
    });

    it("should return null when request not found", async () => {
      // Mock empty result
      const { db } = require("../../utils/database");
      db.limit.mockResolvedValueOnce([]);

      const result = await ResearchRequestModel.findById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all research requests", async () => {
      const result = await ResearchRequestModel.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("topic");
    });
  });

  describe("updateStatus", () => {
    it("should update request status", async () => {
      await ResearchRequestModel.updateStatus("test-id", "completed");

      const { db } = require("../../utils/database");
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
  });
});
