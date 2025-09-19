"use client";

import { researchApi } from "@/lib/api";
import { ResearchDetails } from "@/types";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Tag,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [details, setDetails] = useState<ResearchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const id = params.id as string;

  useEffect(() => {
    if (!id) {
      return;
    }

    const terminalStatuses = new Set(["completed", "failed"]);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;
    let isFetching = false;

    const fetchDetails = async (withLoading = false) => {
      if (isFetching) {
        return;
      }

      isFetching = true;

      if (withLoading) {
        setLoading(true);
      }

      try {
        const data = await researchApi.getResearchById(id);

        if (!isMounted) {
          return;
        }

        setDetails(data);
        setError("");

        if (terminalStatuses.has(data.request.status) && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setError("Failed to load research details");
        console.error("Error fetching research details:", error);
      } finally {
        if (withLoading && isMounted) {
          setLoading(false);
        }

        isFetching = false;
      }
    };

    fetchDetails(true);

    intervalId = setInterval(() => {
      fetchDetails();
    }, 3000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [id]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case "started":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const statusBadgeStyles: Record<
    ResearchDetails["request"]["status"],
    string
  > = {
    completed: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading research details...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Research
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { request, logs, result } = details;
  const enhancedData = result?.enhancedData;
  const summary = enhancedData?.researchSummary;
  const plan = enhancedData?.researchPlan;
  const metadata = enhancedData?.metadata;
  const statusLabel =
    request.status.charAt(0).toUpperCase() + request.status.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Research List
          </Link>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {request.topic}
                </h1>
                <p className="text-sm text-gray-600">
                  Created: {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusBadgeStyles[request.status]
                  }`}
                >
                  {statusLabel}
                </span>
                {metadata?.provider && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Provider: {metadata.provider}
                  </span>
                )}
                {metadata?.totalAnalyzed !== undefined && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {metadata.totalAnalyzed} articles analyzed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {(summary || metadata) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {summary && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">Confidence Level</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.confidenceLevel}/10
                </p>
              </div>
            )}
            {metadata?.totalAnalyzed !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">Articles Processed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metadata.totalAnalyzed}
                </p>
              </div>
            )}
            {metadata?.processingTimestamp && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">Processed At</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(metadata.processingTimestamp).toLocaleString()}
                </p>
              </div>
            )}
            {plan && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">Research Depth</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {plan.researchDepth}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid xl:grid-cols-3 gap-8">
          <div className="space-y-6 xl:col-span-2">
            {summary && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                  Executive Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {summary.executiveSummary}
                </p>
                {summary.sources.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                      Top Sources
                    </h3>
                    <div className="space-y-2">
                      {summary.sources.map((source, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2"
                        >
                          <span className="font-medium text-gray-800">
                            {source.title}
                          </span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-blue-600">
                              {source.relevance}
                            </span>
                            <span className="text-slate-500">
                              {source.credibility}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {summary?.keyFindings?.length ? (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Key Findings</h2>
                <ul className="space-y-3 text-gray-700">
                  {summary.keyFindings.map((finding, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500"></span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {summary?.recommendations?.length ? (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
                <ul className="space-y-3 text-gray-700">
                  {summary.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-green-500"></span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result?.keywords?.length ? (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Top Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {result?.articles?.length ? (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                  Research Articles
                </h2>
                <div className="space-y-4">
                  {result.articles.map((article, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {article.title}
                          </h3>
                          <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-2">
                            {article.source}
                          </span>
                        </div>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Read More
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {article.summary}
                      </p>
                      {(typeof article.relevanceScore === "number" ||
                        typeof article.credibilityScore === "number") && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          {typeof article.relevanceScore === "number" && (
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                              Relevance {article.relevanceScore}/10
                            </span>
                          )}
                          {typeof article.credibilityScore === "number" && (
                            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              Credibility {article.credibilityScore}/10
                            </span>
                          )}
                        </div>
                      )}
                      {article.keyInsights?.length ? (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Key Insights
                          </p>
                          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                            {article.keyInsights.map(
                              (insight, insightIndex) => (
                                <li key={insightIndex}>{insight}</li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            {plan && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Research Plan</h2>
                <div className="space-y-4 text-gray-700">
                  {plan.primaryQuestions.length ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                        Primary Questions
                      </h3>
                      <ul className="space-y-2 list-disc list-inside text-sm">
                        {plan.primaryQuestions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {plan.searchTerms.length ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                        Search Terms
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {plan.searchTerms.map((term, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {plan.expectedFindings.length ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                        Expected Findings
                      </h3>
                      <ul className="space-y-2 list-disc list-inside text-sm">
                        {plan.expectedFindings.map((finding, index) => (
                          <li key={index}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Workflow Progress</h2>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStepIcon(log.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{log.step}</h3>
                      {log.message && (
                        <p className="text-sm text-gray-600 mt-1">
                          {log.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
