import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import {
  generateObject,
  generateText,
  streamObject,
  type LanguageModelUsage,
} from "ai";
import { z } from "zod";
import {
  Article,
  ArticleAnalysis,
  ResearchPlan as ResearchPlanType,
  ResearchSummary,
} from "../types";
import { MetricsService, TokenUsage } from "./metricsService";

// Schemas for structured AI outputs
const boundedString = (limit: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.slice(0, limit) : value),
    z.string().max(limit)
  );

const ArticleAnalysisSchema = z.object({
  relevanceScore: z.number().min(0).max(10),
  mainTopics: z.array(z.string()).max(5),
  summary: boundedString(500),
  keyInsights: z.array(z.string()).max(3),
  credibilityScore: z.number().min(0).max(10),
});

const boundedStringList = (limit: number) =>
  z.array(z.string().min(1)).min(1).max(Math.max(limit * 3, limit + 5));

const ResearchPlanSchema = z.object({
  primaryQuestions: boundedStringList(5),
  searchTerms: boundedStringList(10),
  expectedFindings: boundedStringList(3),
  researchDepth: z.enum(["basic", "intermediate", "comprehensive"]),
});

const ResearchSummarySchema = z.object({
  executiveSummary: boundedString(500),
  keyFindings: z.array(z.string()).max(8),
  recommendations: z.array(z.string()).max(5),
  confidenceLevel: z.number().min(0).max(10),
  sources: z
    .array(
      z.object({
        title: z.string(),
        relevance: z.string(),
        credibility: z.string(),
      })
    )
    .max(5),
});

type Provider = "openai" | "anthropic";

const toTokenUsage = (usage: LanguageModelUsage): TokenUsage => ({
  promptTokens: usage.inputTokens ?? 0,
  completionTokens: usage.outputTokens ?? 0,
  totalTokens:
    usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
});

export class AIService {
  private static getModel(provider: Provider = "anthropic") {
    switch (provider) {
      case "openai":
        return openai("gpt-4o");
      case "anthropic":
        return anthropic("claude-3-5-sonnet-20241022");
      default:
        return anthropic("claude-3-5-sonnet-20241022");
    }
  }

  private static getModelName(provider: Provider = "anthropic"): string {
    switch (provider) {
      case "openai":
        return "gpt-4o";
      case "anthropic":
        return "claude-3-5-sonnet-20241022";
      default:
        return "claude-3-5-sonnet-20241022";
    }
  }

  /**
   * Generate a comprehensive research plan for a given topic
   */
  static async generateResearchPlan(
    topic: string,
    provider: Provider = "anthropic",
    requestId?: string
  ): Promise<ResearchPlanType> {
    const startTime = Date.now();

    const result = await generateObject({
      model: this.getModel(provider),
      schema: ResearchPlanSchema,
      prompt: `You are a research expert. Create a comprehensive research plan for the topic: "${topic}".

      Consider:
      - What are the most important questions to answer? (return up to 5)
      - What search terms would be most effective? (return up to 10)
      - What type of findings should we expect? (return up to 3)
      - How deep should this research go?

      Do not exceed the requested counts. Provide concise, actionable outputs for each section.`,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "generate-research-plan",
        metadata: { topic, ...(requestId ? { requestId } : {}) },
      },
    });

    if (result.usage && requestId) {
      const usageMetrics = toTokenUsage(result.usage);
      const duration = Date.now() - startTime;
      const cost = MetricsService.calculateCost(
        usageMetrics,
        AIService.getModelName(provider)
      );

      MetricsService.recordMetrics({
        requestId,
        provider,
        model: AIService.getModelName(provider),
        operation: "generate-research-plan",
        tokenUsage: usageMetrics,
        cost,
        duration,
        metadata: { topic },
      });
    }

    const plan = result.object as ResearchPlanType;

    const normalizeList = (values: string[], limit: number) =>
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .slice(0, limit);

    return {
      primaryQuestions: normalizeList(plan.primaryQuestions, 5),
      searchTerms: normalizeList(plan.searchTerms, 10),
      expectedFindings: normalizeList(plan.expectedFindings, 3),
      researchDepth: plan.researchDepth,
    };
  }

  /**
   * Analyze and score articles for relevance and quality
   */
  static async analyzeArticles(
    articles: Article[],
    topic: string,
    provider: Provider = "anthropic",
    requestId?: string
  ): Promise<Array<{ article: Article; analysis: ArticleAnalysis }>> {
    const startTime = Date.now();
    let totalTokens = 0;
    let totalCost = 0;

    const analyses = await Promise.all(
      articles.map(async (article, index) => {
        const result = await generateObject({
          model: this.getModel(provider),
          schema: ArticleAnalysisSchema,
          prompt: `Analyze this article for research on "${topic}":

Title: ${article.title}
Content: ${article.summary}
Source: ${article.source}
URL: ${article.url}

Evaluate:
- Relevance to the research topic (0-10)
- Main topics covered
- Key insights extracted
- Credibility based on source and content (0-10)
- Create a concise summary (maximum 500 characters)

Be thorough and critical in your analysis.`,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "analyze-article",
            metadata: {
              topic,
              articleIndex: index,
              ...(requestId ? { requestId } : {}),
            },
          },
        });

        if (result.usage && requestId) {
          const usageMetrics = toTokenUsage(result.usage);
          const cost = MetricsService.calculateCost(
            usageMetrics,
            AIService.getModelName(provider)
          );
          totalTokens += usageMetrics.totalTokens;
          totalCost += cost;

          MetricsService.recordMetrics({
            requestId,
            provider,
            model: AIService.getModelName(provider),
            operation: "analyze-article",
            tokenUsage: usageMetrics,
            cost,
            duration: Date.now() - startTime,
            metadata: { topic, articleTitle: article.title },
          });
        }

        return {
          article,
          analysis: result.object as ArticleAnalysis,
        };
      })
    );

    // Record aggregate metrics
    if (requestId) {
      const duration = Date.now() - startTime;
      MetricsService.recordMetrics({
        requestId,
        provider,
        model: AIService.getModelName(provider),
        operation: "analyze-articles-batch",
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens },
        cost: totalCost,
        duration,
        metadata: { topic, articlesCount: articles.length },
      });
    }

    // Sort by relevance score and return top articles with analysis
    return analyses.sort(
      (a, b) => b.analysis.relevanceScore - a.analysis.relevanceScore
    );
  }

  /**
   * Generate enhanced keywords using AI
   */
  static async generateKeywords(
    topic: string,
    articles: Article[],
    provider: Provider = "anthropic",
    requestId?: string
  ) {
    const startTime = Date.now();
    const articlesText = articles
      .map((article) => `${article.title}: ${article.summary}`)
      .join("\n\n");

    const result = await generateText({
      model: this.getModel(provider),
      prompt: `Based on the research topic "${topic}" and these articles:

${articlesText}

Generate 10-15 relevant keywords that capture:
1. Core concepts and themes
2. Technical terminology
3. Related fields and applications
4. Emerging trends mentioned

Return only the keywords as a comma-separated list, no explanations.`,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "generate-keywords",
        metadata: {
          topic,
          articlesCount: articles.length,
          ...(requestId ? { requestId } : {}),
        },
      },
    });

    if (result.usage && requestId) {
      const usageMetrics = toTokenUsage(result.usage);
      const duration = Date.now() - startTime;
      const cost = MetricsService.calculateCost(
        usageMetrics,
        AIService.getModelName(provider)
      );

      MetricsService.recordMetrics({
        requestId,
        provider,
        model: AIService.getModelName(provider),
        operation: "generate-keywords",
        tokenUsage: usageMetrics,
        cost,
        duration,
        metadata: { topic, articlesCount: articles.length },
      });
    }

    return result.text
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .slice(0, 15);
  }

  /**
   * Generate comprehensive research summary
   */
  static async generateResearchSummary(
    topic: string,
    analyzedArticles: Array<{ article: Article; analysis: ArticleAnalysis }>,
    provider: Provider = "anthropic",
    requestId?: string
  ): Promise<ResearchSummary> {
    const startTime = Date.now();
    const topArticles = analyzedArticles.slice(0, 5);
    const sourceMaterial = topArticles
      .map(
        ({ article, analysis }) =>
          `Title: ${article.title}
Source: ${article.source}
Relevance: ${analysis.relevanceScore}/10
Key Insights: ${analysis.keyInsights.join(", ")}
Summary: ${analysis.summary}`
      )
      .join("\n\n---\n\n");

    const result = await generateObject({
      model: this.getModel(provider),
      schema: ResearchSummarySchema,
      prompt: `Create a comprehensive research summary for the topic: "${topic}"

Based on this analyzed source material:
${sourceMaterial}

Generate:
- An executive summary that captures the essence of the research
- Key findings that answer the main questions about this topic
- Actionable recommendations based on the research
- A confidence level in the completeness of this research (0-10)
- Source information highlighting the most valuable sources

Be analytical, well-structured, and evidence-based in your summary.`,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "generate-research-summary",
        metadata: {
          topic,
          sourcesCount: topArticles.length,
          ...(requestId ? { requestId } : {}),
        },
      },
    });

    if (result.usage && requestId) {
      const usageMetrics = toTokenUsage(result.usage);
      const duration = Date.now() - startTime;
      const cost = MetricsService.calculateCost(
        usageMetrics,
        AIService.getModelName(provider)
      );

      MetricsService.recordMetrics({
        requestId,
        provider,
        model: AIService.getModelName(provider),
        operation: "generate-research-summary",
        tokenUsage: usageMetrics,
        cost,
        duration,
        metadata: { topic, sourcesCount: topArticles.length },
      });
    }

    return result.object as ResearchSummary;
  }

  /**
   * Stream research analysis in real-time (useful for UI updates)
   */
  static async streamResearchAnalysis(
    topic: string,
    provider: Provider = "anthropic"
  ) {
    return streamObject({
      model: this.getModel(provider),
      schema: ResearchPlanSchema,
      prompt: `Create a detailed research plan for: "${topic}". Stream your analysis as you think through the research approach.`,
    });
  }

  /**
   * Enhanced article processing with AI-powered analysis
   */
  static async processArticlesWithAI(
    articles: Article[],
    topic: string,
    provider: Provider = "anthropic",
    requestId?: string
  ): Promise<{
    processedArticles: Article[];
    keywords: string[];
    researchSummary: ResearchSummary;
    totalArticlesAnalyzed: number;
    provider: Provider;
  }> {
    // Analyze articles for relevance and quality
    const analyzedArticles = await this.analyzeArticles(
      articles,
      topic,
      provider,
      requestId
    );

    // Get top 5 most relevant articles
    const topArticles = analyzedArticles.slice(0, 5);

    // Generate AI-enhanced keywords
    const keywords = await this.generateKeywords(
      topic,
      topArticles.map((a) => a.article),
      provider,
      requestId
    );

    // Generate comprehensive summary
    const summary = await this.generateResearchSummary(
      topic,
      analyzedArticles,
      provider,
      requestId
    );

    return {
      processedArticles: topArticles.map(({ article, analysis }) => ({
        ...article,
        summary: analysis.summary,
        relevanceScore: analysis.relevanceScore,
        keyInsights: analysis.keyInsights,
        credibilityScore: analysis.credibilityScore,
      })),
      keywords,
      researchSummary: summary,
      totalArticlesAnalyzed: articles.length,
      provider,
    };
  }
}
