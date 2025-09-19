"use client";

import ResearchForm from "@/components/ResearchForm";
import ResearchList from "@/components/ResearchList";
import { researchApi } from "@/lib/api";
import { ResearchRequest } from "@/types";
import { Clock3, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const featureHighlights = [
  {
    title: "Source-aware briefs",
    description:
      "Aggregate news, communities, and reference material into one concise storyline.",
    icon: ShieldCheck,
  },
  {
    title: "Workflow visibility",
    description:
      "Follow every step from parsing through persistence with real-time job logs.",
    icon: Clock3,
  },
  {
    title: "Strategy-first AI",
    description:
      "Plans research paths, extracts insights, and scores credibility before you read a word.",
    icon: LineChart,
  },
];

export default function HomePage() {
  const [requests, setRequests] = useState<ResearchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await researchApi.getAllResearch();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleNewSubmission = () => {
    fetchRequests();
  };

  const completedCount = requests.filter(
    (request) => request.status === "completed"
  ).length;
  const activeCount = requests.filter(
    (request) => request.status === "processing"
  ).length;
  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;
  const latestSubmission = requests[0]?.createdAt
    ? new Date(requests[0].createdAt).toLocaleString()
    : "Awaiting first submission";

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-44 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500/50 via-purple-500/40 to-sky-400/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[360px] w-[360px] rounded-full bg-gradient-to-tl from-violet-500/40 via-fuchsia-500/30 to-sky-500/40 blur-3xl" />
      </div>

      <main className="relative z-10">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
          <section className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" />
              Research Copilot
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Discover credible insights in minutes, not mornings
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Submit a topic and let the AI triage sources, synthesize key
              findings, and surface confidence-backed recommendations — all
              while keeping an audit trail for every decision.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Completed briefs",
                  value: completedCount,
                },
                {
                  label: "Active researches",
                  value: activeCount + pendingCount,
                },
                {
                  label: "Last submission",
                  value: latestSubmission,
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 text-left shadow-lg shadow-blue-500/5"
                >
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {metric.value || metric.value === 0 ? metric.value : "—"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <ResearchForm onSubmit={handleNewSubmission} />
          </section>

          <section className="mt-12 grid gap-4 sm:grid-cols-3">
            {featureHighlights.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6 shadow-lg shadow-blue-500/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </div>
            ))}
          </section>

          <section className="mt-16">
            <div className="mx-auto max-w-4xl">
              {loading ? (
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-8 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-500/40 border-t-blue-400" />
                  <p className="mt-4 text-sm text-slate-300">
                    Loading your research history...
                  </p>
                </div>
              ) : (
                <ResearchList requests={requests} />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
