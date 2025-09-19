import { asc, eq } from "drizzle-orm";
import { WorkflowLogRow, workflowLogs } from "../db/schema";
import { WorkflowLog } from "../types";
import { db } from "../utils/database";

export class WorkflowLogModel {
  static async create(
    requestId: string,
    step: string,
    status: "started" | "completed" | "failed",
    message?: string
  ): Promise<WorkflowLog> {
    const [row] = await db
      .insert(workflowLogs)
      .values({
        requestId,
        step,
        status,
        message: message ?? "",
      })
      .returning();

    return this.mapRow(row);
  }

  static async findByRequestId(requestId: string): Promise<WorkflowLog[]> {
    const rows = await db
      .select()
      .from(workflowLogs)
      .where(eq(workflowLogs.requestId, requestId))
      .orderBy(asc(workflowLogs.timestamp));

    return rows.map(this.mapRow);
  }

  private static mapRow(row: WorkflowLogRow): WorkflowLog {
    return {
      id: row.id,
      requestId: row.requestId,
      step: row.step,
      status: row.status,
      message: row.message ?? "",
      timestamp: row.timestamp,
    };
  }
}
