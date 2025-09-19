import { Request, Response, Router } from "express";
import { MetricsService } from "../services/metricsService";

const router = Router();

interface ProviderCostStats {
  provider: string;
  totalCost: number;
  costPerRequest: number;
  costPerToken: number;
  tokenShare: number;
}

// Get metrics for a specific research request
router.get("/request/:requestId", (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const metrics = MetricsService.getRequestMetrics(requestId);

    if (metrics.length === 0) {
      return res
        .status(404)
        .json({ error: "No metrics found for this request" });
    }

    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalTokens = metrics.reduce(
      (sum, m) => sum + m.tokenUsage.totalTokens,
      0
    );
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);

    res.json({
      requestId,
      summary: {
        operationsCount: metrics.length,
        totalCost: parseFloat(totalCost.toFixed(6)),
        totalTokens,
        totalDuration,
        provider: metrics[0]?.provider,
        model: metrics[0]?.model,
      },
      operations: metrics.map((m) => ({
        operation: m.operation,
        tokenUsage: m.tokenUsage,
        cost: parseFloat(m.cost.toFixed(6)),
        duration: m.duration,
        timestamp: m.timestamp,
        metadata: m.metadata,
      })),
    });
  } catch (error) {
    console.error("Error fetching request metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Get aggregated metrics for a time period
router.get("/aggregate", (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hours = 24 } = req.query;

    let timeRange: { start: Date; end: Date } | undefined;

    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
    } else {
      // Default to last N hours
      const end = new Date();
      const start = new Date(
        end.getTime() - parseInt(hours as string) * 60 * 60 * 1000
      );
      timeRange = { start, end };
    }

    const aggregatedMetrics = MetricsService.getAggregatedMetrics(timeRange);

    res.json({
      timeRange: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
        duration: `${hours} hours`,
      },
      summary: {
        totalRequests: aggregatedMetrics.summary.totalRequests,
        totalTokens: aggregatedMetrics.summary.totalTokens,
        totalCost: parseFloat(aggregatedMetrics.summary.totalCost.toFixed(6)),
        avgDuration: Math.round(aggregatedMetrics.summary.avgDuration),
      },
      breakdown: {
        byProvider: Object.entries(aggregatedMetrics.providerBreakdown).map(
          ([provider, stats]) => ({
            provider,
            requests: stats.count,
            tokens: stats.tokens,
            cost: parseFloat(stats.cost.toFixed(6)),
          })
        ),
        byOperation: Object.entries(aggregatedMetrics.operationBreakdown).map(
          ([operation, stats]) => ({
            operation,
            requests: stats.count,
            avgDuration: Math.round(stats.avgDuration),
            totalCost: parseFloat(stats.totalCost.toFixed(6)),
          })
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching aggregated metrics:", error);
    res.status(500).json({ error: "Failed to fetch aggregated metrics" });
  }
});

// Get recent metrics
router.get("/recent", (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const recentMetrics = MetricsService.getRecentMetrics(
      parseInt(limit as string)
    );

    res.json({
      count: recentMetrics.length,
      metrics: recentMetrics.map((m) => ({
        requestId: m.requestId,
        operation: m.operation,
        provider: m.provider,
        model: m.model,
        tokenUsage: m.tokenUsage,
        cost: parseFloat(m.cost.toFixed(6)),
        duration: m.duration,
        timestamp: m.timestamp,
        metadata: m.metadata,
      })),
    });
  } catch (error) {
    console.error("Error fetching recent metrics:", error);
    res.status(500).json({ error: "Failed to fetch recent metrics" });
  }
});

// Get cost analysis
router.get("/costs", (req: Request, res: Response) => {
  try {
    const { hours = 24 } = req.query;
    const end = new Date();
    const start = new Date(
      end.getTime() - parseInt(hours as string) * 60 * 60 * 1000
    );

    const aggregatedMetrics = MetricsService.getAggregatedMetrics({
      start,
      end,
    });

    // Cost efficiency metrics
    const costPerRequest =
      aggregatedMetrics.summary.totalRequests > 0
        ? aggregatedMetrics.summary.totalCost /
          aggregatedMetrics.summary.totalRequests
        : 0;

    const costPerToken =
      aggregatedMetrics.summary.totalTokens > 0
        ? aggregatedMetrics.summary.totalCost /
          aggregatedMetrics.summary.totalTokens
        : 0;

    const providerCostComparison: ProviderCostStats[] = Object.entries(
      aggregatedMetrics.providerBreakdown
    ).map(([provider, stats]) => ({
      provider,
      totalCost: parseFloat(stats.cost.toFixed(6)),
      costPerRequest:
        stats.count > 0 ? parseFloat((stats.cost / stats.count).toFixed(6)) : 0,
      costPerToken:
        stats.tokens > 0
          ? parseFloat((stats.cost / stats.tokens).toFixed(8))
          : 0,
      tokenShare:
        aggregatedMetrics.summary.totalTokens > 0
          ? parseFloat(
              (
                (stats.tokens / aggregatedMetrics.summary.totalTokens) *
                100
              ).toFixed(1)
            )
          : 0,
    }));

    res.json({
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        hours: parseInt(hours as string),
      },
      costSummary: {
        totalCost: parseFloat(aggregatedMetrics.summary.totalCost.toFixed(6)),
        costPerRequest: parseFloat(costPerRequest.toFixed(6)),
        costPerToken: parseFloat(costPerToken.toFixed(8)),
      },
      providerComparison: providerCostComparison,
    });
  } catch (error) {
    console.error("Error fetching cost analysis:", error);
    res.status(500).json({ error: "Failed to fetch cost analysis" });
  }
});

// Export metrics (for analysis)
router.get("/export", (_req: Request, res: Response) => {
  try {
    const allMetrics = MetricsService.exportMetrics();

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ai-metrics-${Date.now()}.json"`
    );

    res.json({
      exportedAt: new Date().toISOString(),
      totalRecords: allMetrics.length,
      metrics: allMetrics,
    });
  } catch (error) {
    console.error("Error exporting metrics:", error);
    res.status(500).json({ error: "Failed to export metrics" });
  }
});

// Health check for metrics service
router.get("/health", (_req: Request, res: Response) => {
  try {
    const recentMetrics = MetricsService.getRecentMetrics(10);
    const aggregated = MetricsService.getAggregatedMetrics();

    res.json({
      status: "healthy",
      metricsCount: recentMetrics.length,
      lastActivity: recentMetrics[0]?.timestamp || null,
      totalCost: parseFloat(aggregated.summary.totalCost.toFixed(6)),
      totalTokens: aggregated.summary.totalTokens,
    });
  } catch (error) {
    console.error("Metrics health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
