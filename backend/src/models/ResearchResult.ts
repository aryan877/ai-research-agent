import { eq } from "drizzle-orm";
import { ResearchResultRow, researchResults } from "../db/schema";
import { Article, EnhancedResearchData, ResearchResult } from "../types";
import { db } from "../utils/database";

export class ResearchResultModel {
  static async create(
    requestId: string,
    articles: Article[],
    keywords: string[],
    enhancedData?: EnhancedResearchData
  ): Promise<ResearchResult> {
    const [row] = await db
      .insert(researchResults)
      .values({
        requestId,
        articles,
        keywords,
        enhancedData: enhancedData ?? null,
      })
      .returning();

    return this.mapRow(row);
  }

  static async findByRequestId(
    requestId: string
  ): Promise<ResearchResult | null> {
    const [row] = await db
      .select()
      .from(researchResults)
      .where(eq(researchResults.requestId, requestId))
      .limit(1);

    return row ? this.mapRow(row) : null;
  }

  private static mapRow(row: ResearchResultRow): ResearchResult {
    return {
      id: row.id,
      requestId: row.requestId,
      articles: row.articles,
      keywords: row.keywords,
      enhancedData: row.enhancedData ?? undefined,
      createdAt: row.createdAt,
    };
  }
}
