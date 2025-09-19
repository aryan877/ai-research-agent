import { Request, Response } from "express";
import { ResearchRequestModel } from "../models/ResearchRequest";
import { ResearchResultModel } from "../models/ResearchResult";
import { WorkflowLogModel } from "../models/WorkflowLog";
import { WorkflowLog } from "../types";
import { addResearchJob } from "../utils/queue";

export class ResearchController {
  static async submitResearch(req: Request, res: Response) {
    try {
      const { topic, provider = "anthropic" } = req.body;

      if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
        return res
          .status(400)
          .json({ error: "Topic is required and must be a non-empty string" });
      }

      if (provider && !["openai", "anthropic"].includes(provider)) {
        return res
          .status(400)
          .json({ error: 'Provider must be either "openai" or "anthropic"' });
      }

      const request = await ResearchRequestModel.create(topic.trim());

      await addResearchJob(request.id, request.topic, provider);

      res.status(201).json({
        id: request.id,
        topic: request.topic,
        status: request.status,
        provider,
        createdAt: request.createdAt,
      });
    } catch (error) {
      console.error("Error submitting research:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getAllResearch(_req: Request, res: Response) {
    try {
      const requests = await ResearchRequestModel.findAll();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching research requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getResearchById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const request = await ResearchRequestModel.findById(id);
      if (!request) {
        return res.status(404).json({ error: "Research request not found" });
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
