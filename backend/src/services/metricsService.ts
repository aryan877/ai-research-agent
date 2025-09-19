export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

type AIMetadataValue = string | number | boolean | null | undefined;
type AIMetadata = Record<string, AIMetadataValue>;

interface AIMetrics {
  requestId: string;
  provider: 'openai' | 'anthropic';
  model: string;
  operation: string;
  tokenUsage: TokenUsage;
  cost: number;
  duration: number;
  timestamp: Date;
  metadata?: AIMetadata;
}

interface ProviderPricing {
  inputTokensPerDollar: number;
  outputTokensPerDollar: number;
}

// Token pricing (per million tokens) as of 2024
const PRICING: Record<string, ProviderPricing> = {
  'gpt-4o': {
    inputTokensPerDollar: 400000,   // $2.50 per 1M input tokens
    outputTokensPerDollar: 100000,  // $10.00 per 1M output tokens
  },
  'gpt-4o-mini': {
    inputTokensPerDollar: 6666667,  // $0.15 per 1M input tokens
    outputTokensPerDollar: 1666667, // $0.60 per 1M output tokens
  },
  'claude-3-5-sonnet-20241022': {
    inputTokensPerDollar: 333333,   // $3.00 per 1M input tokens
    outputTokensPerDollar: 66667,   // $15.00 per 1M output tokens
  },
  'claude-3-haiku-20240307': {
    inputTokensPerDollar: 4000000,  // $0.25 per 1M input tokens
    outputTokensPerDollar: 800000,  // $1.25 per 1M output tokens
  },
};

export class MetricsService {
  private static metrics: AIMetrics[] = [];

  /**
   * Calculate cost based on token usage and provider pricing
   */
  static calculateCost(usage: TokenUsage, model: string): number {
    const pricing = PRICING[model];
    if (!pricing) {
      console.warn(`No pricing info for model: ${model}`);
      return 0;
    }

    const inputCost = usage.promptTokens / pricing.inputTokensPerDollar;
    const outputCost = usage.completionTokens / pricing.outputTokensPerDollar;

    return inputCost + outputCost;
  }

  /**
   * Record AI operation metrics
   */
  static recordMetrics(metrics: Omit<AIMetrics, 'timestamp'>) {
    const fullMetrics: AIMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetrics);

    // Log for immediate visibility
    console.log(`[AI METRICS] ${metrics.operation} | ${metrics.provider}:${metrics.model} | Tokens: ${metrics.tokenUsage.totalTokens} | Cost: $${metrics.cost.toFixed(4)} | Duration: ${metrics.duration}ms`);

    // Keep only last 1000 metrics in memory (for production, use proper storage)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get metrics for a specific request
   */
  static getRequestMetrics(requestId: string): AIMetrics[] {
    return this.metrics.filter(m => m.requestId === requestId);
  }

  /**
   * Get aggregated metrics
   */
  static getAggregatedMetrics(timeRange?: { start: Date; end: Date }) {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    const totalTokens = filteredMetrics.reduce((sum, m) => sum + m.tokenUsage.totalTokens, 0);
    const totalCost = filteredMetrics.reduce((sum, m) => sum + m.cost, 0);
    const avgDuration = filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / filteredMetrics.length
      : 0;

    const providerStats = filteredMetrics.reduce((stats, m) => {
      if (!stats[m.provider]) {
        stats[m.provider] = { count: 0, tokens: 0, cost: 0 };
      }
      stats[m.provider].count++;
      stats[m.provider].tokens += m.tokenUsage.totalTokens;
      stats[m.provider].cost += m.cost;
      return stats;
    }, {} as Record<string, { count: number; tokens: number; cost: number }>);

    const operationStats = filteredMetrics.reduce((stats, m) => {
      if (!stats[m.operation]) {
        stats[m.operation] = { count: 0, avgDuration: 0, totalCost: 0 };
      }
      stats[m.operation].count++;
      stats[m.operation].totalCost += m.cost;
      return stats;
    }, {} as Record<string, { count: number; avgDuration: number; totalCost: number }>);

    // Calculate average duration per operation
    Object.keys(operationStats).forEach(op => {
      const opMetrics = filteredMetrics.filter(m => m.operation === op);
      operationStats[op].avgDuration = opMetrics.reduce((sum, m) => sum + m.duration, 0) / opMetrics.length;
    });

    return {
      summary: {
        totalRequests: filteredMetrics.length,
        totalTokens,
        totalCost,
        avgDuration,
      },
      providerBreakdown: providerStats,
      operationBreakdown: operationStats,
      timeRange: timeRange || {
        start: filteredMetrics[0]?.timestamp || new Date(),
        end: filteredMetrics[filteredMetrics.length - 1]?.timestamp || new Date(),
      },
    };
  }

  /**
   * Get recent metrics (last N entries)
   */
  static getRecentMetrics(limit: number = 50): AIMetrics[] {
    return this.metrics.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Export all metrics (for analysis)
   */
  static exportMetrics(): AIMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics (useful for testing)
   */
  static clearMetrics() {
    this.metrics = [];
  }
}
