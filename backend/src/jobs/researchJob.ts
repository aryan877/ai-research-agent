import { Job } from "bull";
import { ResearchRequestModel } from "../models/ResearchRequest";
import { ResearchResultModel } from "../models/ResearchResult";
import { WorkflowLogModel } from "../models/WorkflowLog";
import { AIService } from "../services/aiService";
import { NewsService } from "../services/newsService";

export interface ResearchJobData {
  requestId: string;
  topic: string;
  provider?: "openai" | "anthropic";
}

export const processResearchJob = async (job: Job<ResearchJobData>) => {
  const { requestId, topic, provider = "anthropic" } = job.data;

  try {
    // Step 1: Input Parsing & Research Planning
    await WorkflowLogModel.create(
      requestId,
      "Input Parsing",
      "started",
      "Validating research topic and generating research plan"
    );
    await ResearchRequestModel.updateStatus(requestId, "processing");

    const researchPlan = await AIService.generateResearchPlan(
      topic,
      provider,
      requestId
    );
    await WorkflowLogModel.create(
      requestId,
      "Input Parsing",
      "completed",
      `Research plan generated with ${researchPlan.primaryQuestions.length} key questions and ${researchPlan.searchTerms.length} search terms`
    );

    // Step 2: Data Gathering
    await WorkflowLogModel.create(
      requestId,
      "Data Gathering",
      "started",
      "Fetching articles from external API"
    );
    const rawArticles = await NewsService.fetchArticles(topic);
    await WorkflowLogModel.create(
      requestId,
      "Data Gathering",
      "completed",
      `Fetched ${rawArticles.length} articles`
    );

    // Step 3: AI-Powered Processing
    await WorkflowLogModel.create(
      requestId,
      "AI Processing",
      "started",
      "Analyzing articles with AI for relevance and insights"
    );
    const aiResults = await AIService.processArticlesWithAI(
      rawArticles,
      topic,
      provider,
      requestId
    );

    await WorkflowLogModel.create(
      requestId,
      "AI Processing",
      "completed",
      `AI analysis completed: ${aiResults.processedArticles.length} top articles selected, ${aiResults.keywords.length} keywords generated`
    );

    // Step 4: Result Persistence
    await WorkflowLogModel.create(
      requestId,
      "Result Persistence",
      "started",
      "Saving enhanced results to database"
    );

    // Save with enhanced data structure
    const enhancedResult = {
      articles: aiResults.processedArticles,
      keywords: aiResults.keywords,
      researchSummary: aiResults.researchSummary,
      researchPlan,
      metadata: {
        provider,
        totalAnalyzed: aiResults.totalArticlesAnalyzed,
        processingTimestamp: new Date().toISOString(),
      },
    };

    await ResearchResultModel.create(
      requestId,
      aiResults.processedArticles,
      aiResults.keywords,
      enhancedResult
    );
    await ResearchRequestModel.updateStatus(requestId, "completed");
    await WorkflowLogModel.create(
      requestId,
      "Result Persistence",
      "completed",
      "Enhanced AI results saved successfully"
    );

    console.log(
      `AI-enhanced research job completed for request ${requestId} using ${provider}`
    );
  } catch (error) {
    console.error(`Research job failed for request ${requestId}:`, error);
    await ResearchRequestModel.updateStatus(requestId, "failed");
    await WorkflowLogModel.create(
      requestId,
      "Error",
      "failed",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
    throw error;
  }
};
