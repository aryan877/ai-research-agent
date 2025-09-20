"use client";

import ResearchForm from "@/components/ResearchForm";
import ResearchList from "@/components/ResearchList";
import { useUserId } from "@/hooks/useUserId";
import { researchApi } from "@/lib/api";
import { ResearchRequest } from "@/types";
import { useCallback, useEffect, useState } from "react";

const SAMPLE_TOPICS = [
  "Impact of artificial intelligence on healthcare diagnostics",
  "Climate change effects on global food security",
  "Future of renewable energy storage technologies",
  "Quantum computing applications in cryptography",
  "Social media's influence on mental health in teenagers",
  "Gene therapy breakthroughs in treating rare diseases",
];

export default function HomePage() {
  const [requests, setRequests] = useState<ResearchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSampleTopic, setSelectedSampleTopic] = useState<string>("");
  const userId = useUserId();

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);

    try {
      const data = await researchApi.getAllResearch(userId);
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    fetchRequests();
  }, [fetchRequests, userId]);

  const handleNewSubmission = () => {
    setSelectedSampleTopic("");
    fetchRequests();
  };

  const handleSampleTopicSelect = (topic: string) => {
    setSelectedSampleTopic(topic);
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">AI Research Agent</h1>
          <p className="mt-2 text-neutral-400">
            Submit research topics and get automated insights
          </p>
        </header>

        <div className="space-y-8">
          <ResearchForm
            userId={userId}
            onSubmit={handleNewSubmission}
            initialTopic={selectedSampleTopic}
          />

          {/* Sample research topics - horizontally scrollable */}
          <div className="px-1">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {SAMPLE_TOPICS.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleTopicSelect(topic)}
                  className="flex-shrink-0 text-xs px-4 py-2 rounded-full bg-neutral-800/60 border border-neutral-700/30 hover:border-neutral-600/50 hover:bg-neutral-800/80 transition-all duration-200 text-neutral-400 hover:text-neutral-200 whitespace-nowrap"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-neutral-900/90 p-8 text-center shadow-xl">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
              <p className="mt-4 text-neutral-400">Loading...</p>
            </div>
          ) : (
            <ResearchList requests={requests} />
          )}
        </div>
      </main>
    </div>
  );
}
