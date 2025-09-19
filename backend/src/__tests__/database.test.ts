import { db, pool } from "../utils/database";

describe("Database Connection", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("should connect to database successfully", async () => {
    const result = await db.execute(`SELECT 1 as test`);
    expect(result).toBeDefined();
  });

  it("should handle database queries", async () => {
    const result = await db.execute(`SELECT current_timestamp as now`);
    expect(result).toBeDefined();
  });
});
