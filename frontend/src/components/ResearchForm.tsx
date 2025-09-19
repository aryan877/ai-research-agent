"use client";

import { researchApi } from "@/lib/api";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

interface ResearchFormProps {
  onSubmit: () => void;
  className?: string;
}

export default function ResearchForm({
  onSubmit,
  className,
}: ResearchFormProps) {
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;

    setIsSubmitting(true);
    setError("");

    try {
      await researchApi.submitResearch(trimmedTopic, "anthropic");
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
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-white"
              htmlFor="research-topic"
            >
              Research Topic
            </label>
            <div className="relative mt-2">
              <input
                id="research-topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Enter your research topic..."
                className="w-full rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 pr-12 text-sm text-white placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!topic.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-neutral-600"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!topic.trim() || isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-neutral-600"
            >
              {isSubmitting ? "Submitting..." : "Start Research"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
