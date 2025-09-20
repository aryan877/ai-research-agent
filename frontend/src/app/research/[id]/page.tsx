"use client";

import { useUserId } from "@/hooks/useUserId";
import { researchApi } from "@/lib/api";
import { ResearchDetails } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [details, setDetails] = useState<ResearchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = useUserId();

  const id = params.id as string;

  useEffect(() => {
    if (!id || !userId) {
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
        const data = await researchApi.getResearchById(id, userId);

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
  }, [id, userId]);

  const getStepTone = (status: string) => {
    switch (status) {
      case "started":
        return "bg-blue-400";
      case "completed":
        return "bg-green-400";
      case "failed":
        return "bg-red-400";
      default:
        return "bg-neutral-500";
    }
  };

  const statusThemes: Record<
    ResearchDetails["request"]["status"],
    {
      label: string;
      badge: string;
      description: string;
    }
  > = {
    completed: {
      label: "Completed",
      badge: "bg-green-500/15 text-green-300",
      description:
        "Brief delivered. Review insights, citations, and guardrails below.",
    },
    processing: {
      label: "Processing",
      badge: "bg-blue-500/15 text-blue-300",
      description:
        "Agents are synthesizing sources, scoring credibility, and drafting findings.",
    },
    pending: {
      label: "Pending",
      badge: "bg-yellow-500/15 text-yellow-300",
      description: "Queued for validation. We'll begin sourcing momentarily.",
    },
    failed: {
      label: "Failed",
      badge: "bg-red-500/15 text-red-300",
      description:
        "We hit a blocker. Inspect the workflow log for recovery options.",
    },
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-neutral-200">
        <div className="relative z-10 rounded-xl bg-neutral-900 px-10 py-12 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
          <p className="mt-4 text-sm text-neutral-400">
            Loading research details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-neutral-200">
        <div className="relative z-10 rounded-2xl bg-neutral-900/90 px-10 py-12 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-lg font-semibold text-red-300">
            !
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">
            Error loading research
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {error || "We could not retrieve the requested brief."}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 rounded-md bg-neutral-700 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-600"
          >
            Go back
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
  const theme = statusThemes[request.status];
  const providerKey =
    (metadata?.provider as "openai" | "anthropic" | undefined) ||
    request.provider;
  const providerLabel =
    providerKey === "openai" ? "OpenAI • GPT-4o" : "Anthropic • Claude";
  const createdAt = new Date(request.createdAt).toLocaleString();
  const processedAt = metadata?.processingTimestamp
    ? new Date(metadata.processingTimestamp).toLocaleString()
    : null;
  const metrics: Array<{ label: string; value: string; helper?: string }> = [];
  if (summary) {
    metrics.push({
      label: "Confidence score",
      value: `${summary.confidenceLevel}/10`,
      helper: "Weighted trust & alignment",
    });
  }
  if (metadata?.totalAnalyzed !== undefined) {
    metrics.push({
      label: "Articles processed",
      value: metadata.totalAnalyzed.toString(),
      helper: "Across trusted sources",
    });
  }
  if (processedAt) {
    metrics.push({
      label: "Processed at",
      value: processedAt,
    });
  }
  if (plan?.researchDepth) {
    metrics.push({
      label: "Research depth",
      value: plan.researchDepth,
      helper: "Projected coverage",
    });
  }
  const lastLog = logs.length ? logs[logs.length - 1] : null;
  const timelineTone = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20";
      case "failed":
        return "bg-red-500/20";
      case "started":
        return "bg-blue-500/20";
      default:
        return "bg-neutral-800/80";
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-base font-semibold text-white">
              {"<"}
            </span>
            Back to dashboard
          </Link>

          <header className="relative mt-6 overflow-hidden rounded-3xl bg-neutral-900/90 p-10 shadow-2xl">
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-800/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                  Research brief
                </div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  {request.topic}
                </h1>
                <p className="text-sm text-neutral-300">{theme.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
                  <span className="rounded-full bg-neutral-800/80 px-3 py-1">
                    Created {createdAt}
                  </span>
                  <span className="rounded-full bg-neutral-800/80 px-3 py-1">
                    Provider {providerLabel}
                  </span>
                  <span className="rounded-full bg-neutral-800/80 px-3 py-1">
                    Request ID {request.id.slice(0, 8)}
                  </span>
                </div>
              </div>
              <div className="w-full max-w-xs rounded-2xl bg-neutral-800/90 p-6 shadow-lg">
                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                  Status
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${theme.badge} ${
                    request.status === "processing" ? "animate-pulse" : ""
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full bg-current ${
                    request.status === "processing" ? "animate-ping" : ""
                  }`} />
                  {theme.label}
                </span>
                {lastLog && (
                  <p className="mt-4 text-xs text-neutral-500">
                    Last update {new Date(lastLog.timestamp).toLocaleString()}
                  </p>
                )}
                {summary && (
                  <div className="mt-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-400">
                    Confidence {summary.confidenceLevel}/10
                  </div>
                )}
                {metadata?.totalAnalyzed !== undefined && (
                  <div className="mt-3 rounded-xl bg-neutral-900 px-4 py-3 text-xs text-neutral-400">
                    {metadata.totalAnalyzed} sources processed
                  </div>
                )}
              </div>
            </div>
          </header>

          {metrics.length > 0 && (
            <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl bg-neutral-900 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {metric.value}
                  </p>
                  {metric.helper && (
                    <p className="mt-2 text-xs text-neutral-500">
                      {metric.helper}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          <div className="mt-12 grid gap-10 xl:grid-cols-[1.2fr_0.85fr]">
            <div className="space-y-8">
              {summary && (
                <div className="rounded-3xl bg-neutral-900/90 p-8 shadow-xl">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold text-white">
                      Executive summary
                    </h2>
                    <span className="rounded-full bg-neutral-800/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.35em] text-neutral-500">
                      {theme.label}
                    </span>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-neutral-300">
                    {summary.executiveSummary}
                  </p>
                  {summary.sources.length > 0 && (
                    <div className="mt-8 rounded-2xl bg-neutral-800/80 p-5">
                      <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                        Top sources
                      </p>
                      <div className="mt-4 space-y-3">
                        {summary.sources.map((source, index) => (
                          <div
                            key={`${source.title}-${index}`}
                            className="flex flex-col gap-2 rounded-2xl bg-neutral-900/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {source.title}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                                <span className="rounded-full bg-neutral-800/80 px-3 py-1">
                                  Relevance {source.relevance}
                                </span>
                                <span className="rounded-full bg-neutral-800/80 px-3 py-1">
                                  Credibility {source.credibility}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {summary?.keyFindings?.length ? (
                <div className="rounded-3xl bg-neutral-900/90 p-8 shadow-xl">
                  <h2 className="text-xl font-semibold text-white">
                    Key findings
                  </h2>
                  <div className="mt-4 space-y-3">
                    {summary.keyFindings.map((finding, index) => (
                      <div
                        key={`finding-${index}`}
                        className="rounded-2xl bg-neutral-800/80 p-4"
                      >
                        <p className="text-sm text-neutral-300">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {summary?.recommendations?.length ? (
                <div className="rounded-3xl bg-neutral-900/90 p-8 shadow-xl">
                  <h2 className="text-xl font-semibold text-white">
                    Recommendations
                  </h2>
                  <div className="mt-4 space-y-3">
                    {summary.recommendations.map((recommendation, index) => (
                      <div
                        key={`recommendation-${index}`}
                        className="rounded-2xl bg-neutral-800/80 p-4"
                      >
                        <p className="text-sm text-neutral-300">
                          {recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {result?.articles?.length ? (
                <div className="rounded-3xl bg-neutral-900/90 p-8 shadow-xl">
                  <h2 className="text-xl font-semibold text-white">
                    Research articles
                  </h2>
                  <div className="mt-6 space-y-6">
                    {result.articles.map((article, index) => (
                      <div
                        key={`${article.url}-${index}`}
                        className="rounded-2xl bg-neutral-800/80 p-6 transition hover:bg-neutral-700/70"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {article.title}
                          </h3>
                          <span className="mt-2 inline-flex items-center rounded-full bg-neutral-900/80 px-3 py-1 text-xs text-neutral-400">
                            {article.source}
                          </span>
                        </div>
                        <div className="mt-3">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-blue-200"
                          >
                            View article
                            <span className="text-xs">-&gt;</span>
                          </a>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-neutral-300">
                          {article.summary}
                        </p>
                        {(typeof article.relevanceScore === "number" ||
                          typeof article.credibilityScore === "number") && (
                          <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-400">
                            {typeof article.relevanceScore === "number" && (
                              <span className="rounded-full bg-neutral-900/80 px-3 py-1">
                                Relevance {article.relevanceScore}/10
                              </span>
                            )}
                            {typeof article.credibilityScore === "number" && (
                              <span className="rounded-full bg-neutral-900/80 px-3 py-1">
                                Credibility {article.credibilityScore}/10
                              </span>
                            )}
                          </div>
                        )}
                        {article.keyInsights?.length ? (
                          <div className="mt-4 rounded-2xl bg-neutral-900/80 p-4">
                            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                              Key insights
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-neutral-300 list-disc list-inside">
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

            <aside className="space-y-8">
              {plan && (
                <div className="rounded-3xl bg-neutral-900/90 p-6 shadow-xl">
                  <h2 className="text-xl font-semibold text-white">
                    Research plan
                  </h2>
                  <div className="mt-5 space-y-5 text-sm text-neutral-300">
                    {plan.primaryQuestions.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                          Primary questions
                        </p>
                        <ul className="mt-2 space-y-2 rounded-2xl bg-neutral-800/80 p-4">
                          {plan.primaryQuestions.map((question, index) => (
                            <li key={`question-${index}`}>{question}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {plan.searchTerms.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                          Search terms
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {plan.searchTerms.map((term, index) => (
                            <span
                              key={`term-${index}`}
                              className="rounded-full bg-neutral-800/80 px-3 py-1 text-xs text-neutral-400"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {plan.expectedFindings.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                          Expected findings
                        </p>
                        <ul className="mt-2 space-y-2 rounded-2xl bg-neutral-800/80 p-4">
                          {plan.expectedFindings.map((finding, index) => (
                            <li key={`expected-${index}`}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {result?.keywords?.length ? (
                <div className="rounded-3xl bg-neutral-900/90 p-6 shadow-xl">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    Top keywords
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.keywords.map((keyword, index) => (
                      <span
                        key={`keyword-${index}`}
                        className="rounded-full bg-neutral-800/80 px-4 py-1.5 text-xs font-medium text-neutral-300"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {(metadata?.totalAnalyzed !== undefined ||
                processedAt ||
                summary) && (
                <div className="rounded-3xl bg-neutral-900/90 p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/15">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                        Data snapshot
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        Quality guardrails
                      </h3>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-neutral-300">
                    {metadata?.totalAnalyzed !== undefined && (
                      <li>
                        <span>
                          {metadata.totalAnalyzed} distinct articles evaluated
                        </span>
                      </li>
                    )}
                    {summary && (
                      <li>
                        <span>
                          Confidence scoring: {summary.confidenceLevel}/10
                        </span>
                      </li>
                    )}
                    {processedAt && (
                      <li>
                        <span>Processing completed {processedAt}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="rounded-3xl bg-neutral-900/90 p-6 shadow-xl">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                  Workflow timeline
                  {request.status === "processing" && (
                    <span className="flex h-2 w-2">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                    </span>
                  )}
                </h2>
                <div className="mt-6 space-y-6">
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative pl-8">
                      {index < logs.length - 1 && (
                        <span className="absolute left-[11px] top-6 h-full w-0.5 bg-neutral-700" />
                      )}
                      <span
                        className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full ${timelineTone(
                          log.status
                        )} ${
                          log.status === "started" && request.status === "processing" ? "animate-pulse" : ""
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${getStepTone(
                            log.status
                          )} ${
                            log.status === "started" && request.status === "processing" ? "animate-ping" : ""
                          }`}
                        />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {log.step}
                        </p>
                        {log.message && (
                          <p className="mt-1 text-xs text-neutral-400">
                            {log.message}
                          </p>
                        )}
                        <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-neutral-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
