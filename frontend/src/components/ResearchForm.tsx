"use client";

import { researchApi } from "@/lib/api";
import { Loader2, Search, Sparkles } from "lucide-react";
import { useState } from "react";

interface ResearchFormProps {
  onSubmit: () => void;
}

const trendingTopics = [
  "AI strategy for retail",
  "Sustainable aviation fuel market",
  "GenAI policy for enterprises",
  "MedTech regulatory outlook 2025",
];

const providers = [
  {
    value: "anthropic" as const,
    label: "Anthropic Claude",
    badge: "Claude 3.5 Sonnet",
    subtext: "Great for nuanced reasoning and sourcing.",
  },
  {
    value: "openai" as const,
    label: "OpenAI GPT-4o",
    badge: "Multi-modal ready",
    subtext: "Fast synthesis with balanced creativity.",
  },
];

export default function ResearchForm({ onSubmit }: ResearchFormProps) {
  const [topic, setTopic] = useState("");
  const [provider, setProvider] =
    useState<(typeof providers)[number]["value"]>("anthropic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;

    setIsSubmitting(true);
    setError("");

    try {
      await researchApi.submitResearch(trimmedTopic, provider);
      setTopic("");
      onSubmit();
    } catch (submissionError) {
      setError("Failed to submit research request. Please try again.");
      console.error("Error submitting research:", submissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-8 shadow-xl shadow-blue-500/10 backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-800/70 bg-slate-950/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            Launch a Brief
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Kick off a research sprint
          </h2>
          <p className="text-sm text-slate-300">
            Ask a strategic question, market investigation, or policy deep dive.
            We will gather sources, score credibility, and deliver a
            narrative-ready short report.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-200"
              htmlFor="research-topic"
            >
              Research topic
            </label>
            <div className="relative">
              <input
                id="research-topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Impact of AI agents on financial advisory services"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-3 pr-12 text-sm text-slate-100 placeholder-slate-500 shadow-inner shadow-slate-900/60 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!topic.trim() || isSubmitting}
                className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 px-4 text-white shadow-lg shadow-blue-500/40 transition hover:shadow-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mx-auto h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Be specific about the audience or decision you want to support for
              sharper results.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">
              AI provider
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {providers.map((option) => {
                const isActive = provider === option.value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setProvider(option.value)}
                    disabled={isSubmitting}
                    className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-400/40 ${
                      isActive
                        ? "border-blue-400 bg-blue-500/10 text-blue-100 shadow-lg shadow-blue-500/20"
                        : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {option.label}
                      </span>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-widest ${
                          isActive ? "text-blue-200" : "text-slate-500"
                        }`}
                      >
                        {option.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {option.subtext}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">
              Need inspiration?
            </span>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setTopic(preset)}
                  disabled={isSubmitting}
                  className="rounded-full border border-slate-800 bg-slate-950/40 px-4 py-1.5 text-xs text-slate-300 transition hover:border-blue-400 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              We log every step so you can audit data sources and AI reasoning
              later.
            </p>
            <button
              type="submit"
              disabled={!topic.trim() || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>
                {isSubmitting ? "Submitting" : "Generate research brief"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
