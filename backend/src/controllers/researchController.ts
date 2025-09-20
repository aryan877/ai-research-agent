import { Request, Response } from "express";
import { ResearchRequestModel } from "../models/ResearchRequest";
import { ResearchResultModel } from "../models/ResearchResult";
import { WorkflowLogModel } from "../models/WorkflowLog";
import { WorkflowLog } from "../types";
import { addResearchJob } from "../utils/queue";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ResearchController {
  static async submitResearch(req: Request, res: Response) {
    try {
      const { topic, provider = "anthropic", userId } = req.body;

      if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
        return res
          .status(400)
          .json({ error: "Topic is required and must be a non-empty string" });
      }

      if (!userId || typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
        return res
          .status(400)
          .json({ error: "A valid userId must be provided" });
      }

      if (provider && !["openai", "anthropic"].includes(provider)) {
        return res
          .status(400)
          .json({ error: 'Provider must be either "openai" or "anthropic"' });
      }

      const request = await ResearchRequestModel.create(
        topic.trim(),
        userId,
        provider
      );

      await addResearchJob(request.id, request.topic, provider);

      res.status(201).json(request);
    } catch (error) {
      console.error("Error submitting research:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getAllResearch(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
        return res
          .status(400)
          .json({ error: "A valid userId query parameter is required" });
      }

      const requests = await ResearchRequestModel.findAllByUser(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching research requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getResearchById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (!userId || typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
        return res
          .status(400)
          .json({ error: "A valid userId query parameter is required" });
      }

      const request = await ResearchRequestModel.findById(id);
      if (!request) {
        return res.status(404).json({ error: "Research request not found" });
      }

      if (request.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You are not authorized to access this research" });
      }

      const logs = await WorkflowLogModel.findByRequestId(id);
      const aggregatedLogs = ResearchController.aggregateWorkflowLogs(logs);
      const result = await ResearchResultModel.findByRequestId(id);

      res.json({
        request,
        logs: aggregatedLogs,
        result,
      });
    } catch (error) {
      console.error("Error fetching research details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  private static aggregateWorkflowLogs(logs: WorkflowLog[]): WorkflowLog[] {
    if (!logs.length) {
      return logs;
    }

    const stepOrder = [
      "Input Parsing",
      "Data Gathering",
      "AI Processing",
      "Result Persistence",
      "Error",
    ];

    const latestByStep = new Map<string, WorkflowLog>();

    for (const log of logs) {
      latestByStep.set(log.step, log);
    }

    const orderedLogs: WorkflowLog[] = [];

    for (const step of stepOrder) {
      const log = latestByStep.get(step);
      if (log) {
        orderedLogs.push(log);
        latestByStep.delete(step);
      }
    }

    if (latestByStep.size > 0) {
      const remainingLogs = Array.from(latestByStep.values()).sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      orderedLogs.push(...remainingLogs);
    }

    return orderedLogs;
  }
}
