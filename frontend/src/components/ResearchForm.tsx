"use client";

import { researchApi } from "@/lib/api";
import { useState, useEffect } from "react";

const MODEL_OPTIONS: Array<{
  value: "openai" | "anthropic";
  title: string;
  subtitle: string;
}> = [
  {
    value: "anthropic",
    title: "Claude (Anthropic)",
    subtitle: "Nuanced reasoning with strong guardrails",
  },
  {
    value: "openai",
    title: "GPT-4o (OpenAI)",
    subtitle: "Fast multimodal responses with broad knowledge",
  },
];

interface ResearchFormProps {
  onSubmit: () => void;
  userId: string | null;
  className?: string;
  initialTopic?: string;
}

export default function ResearchForm({
  onSubmit,
  userId,
  className,
  initialTopic = "",
}: ResearchFormProps) {
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<"openai" | "anthropic">("anthropic");

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;
    if (!userId) {
      setError(
        "User session is still initializing. Please try again in a moment."
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await researchApi.submitResearch(trimmedTopic, userId, provider);
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
    <div className={`w-full ${className ?? ""}`}>
      <div className="rounded-2xl bg-neutral-900/90 p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="block text-sm font-medium text-white"
              htmlFor="research-topic"
            >
              Research Topic
            </label>
            <div className="mt-2">
              <input
                id="research-topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Enter your research topic..."
                className="w-full rounded-lg bg-neutral-800/80 px-4 py-3 text-sm text-white placeholder-neutral-500 shadow-inner transition focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                disabled={isSubmitting || !userId}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-white">Model</p>
            <p className="mt-1 text-xs text-neutral-400">
              Choose which provider will run this brief.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {MODEL_OPTIONS.map((option) => {
                const isActive = provider === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative cursor-pointer rounded-2xl border-2 px-4 py-4 transition-all duration-200 ${
                      isActive
                        ? "border-blue-400/60 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                        : "border-neutral-700/50 bg-neutral-800/80 hover:border-neutral-600/60 hover:bg-neutral-800"
                    } ${isSubmitting || !userId ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={option.value}
                      checked={isActive}
                      onChange={(e) => setProvider(e.target.value as "openai" | "anthropic")}
                      disabled={isSubmitting || !userId}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className={`block text-sm font-semibold ${isActive ? "text-white" : "text-neutral-300"}`}>
                          {option.title}
                        </span>
                        <span className={`mt-1 block text-xs ${isActive ? "text-blue-200" : "text-neutral-400"}`}>
                          {option.subtitle}
                        </span>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                        isActive
                          ? "border-blue-400 bg-blue-500"
                          : "border-neutral-500 bg-transparent"
                      }`}>
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!topic.trim() || !userId || isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-neutral-700"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              ) : null}
              {isSubmitting ? "Submitting" : "Start Research"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
