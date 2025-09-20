// Used by lib/api.ts responses, components/ResearchList.tsx, and app pages to display requests with consistent status/provider metadata.
export interface ResearchRequest {
  id: string;
  topic: string;
  status: "pending" | "processing" | "completed" | "failed";
  provider: "openai" | "anthropic";
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Used in app/research/[id]/page.tsx when rendering research details so UI pieces share result shape with the backend.
export interface ResearchResult {
  id: string;
  requestId: string;
  articles: Article[];
  keywords: string[];
  enhancedData?: {
    researchSummary: {
      executiveSummary: string;
      keyFindings: string[];
      recommendations: string[];
      confidenceLevel: number;
      sources: Array<{
        title: string;
        relevance: string;
        credibility: string;
      }>;
    };
    researchPlan: {
      primaryQuestions: string[];
      searchTerms: string[];
      expectedFindings: string[];
      researchDepth: string;
    };
    metadata: {
      provider: string;
      totalAnalyzed: number;
      processingTimestamp: string;
    };
  };
  createdAt: string;
}

// Used within ResearchResult for article cards in research detail views, ensuring summaries and scores stay typed.
export interface Article {
  title: string;
  summary: string;
  url: string;
  source: string;
  relevanceScore?: number;
  keyInsights?: string[];
  credibilityScore?: number;
}

// Used in app/research/[id]/page.tsx to show workflow timeline entries that mirror backend workflow logs.
export interface WorkflowLog {
  id: string;
  requestId: string;
  step: string;
  status: "started" | "completed" | "failed";
  message: string;
  timestamp: string;
}

// Used by lib/api.ts getResearchById and app/research/[id]/page.tsx state to bundle the request, logs, and optional result.
export interface ResearchDetails {
  request: ResearchRequest;
  logs: WorkflowLog[];
  result: ResearchResult | null;
}
