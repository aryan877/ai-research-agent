import { desc, eq } from "drizzle-orm";
import { ResearchRequestRow, researchRequests } from "../db/schema";
import { ResearchRequest } from "../types";
import { db } from "../utils/database";

export class ResearchRequestModel {
  static async create(topic: string): Promise<ResearchRequest> {
    const [row] = await db
      .insert(researchRequests)
      .values({ topic })
      .returning();
    return this.mapRow(row);
  }

  static async findById(id: string): Promise<ResearchRequest | null> {
    const [row] = await db
      .select()
      .from(researchRequests)
      .where(eq(researchRequests.id, id))
      .limit(1);

    return row ? this.mapRow(row) : null;
  }

  static async findAll(): Promise<ResearchRequest[]> {
    const rows = await db
      .select()
      .from(researchRequests)
      .orderBy(desc(researchRequests.createdAt));

    return rows.map(this.mapRow);
  }

  static async updateStatus(
    id: string,
    status: ResearchRequest["status"]
  ): Promise<void> {
    await db
      .update(researchRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(researchRequests.id, id));
  }

  private static mapRow(row: ResearchRequestRow): ResearchRequest {
    return {
      id: row.id,
      topic: row.topic,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
