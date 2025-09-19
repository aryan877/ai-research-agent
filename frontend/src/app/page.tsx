"use client";

import ResearchForm from "@/components/ResearchForm";
import ResearchList from "@/components/ResearchList";
import { researchApi } from "@/lib/api";
import { ResearchRequest } from "@/types";
import { useEffect, useState } from "react";

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

  return (
    <div className="min-h-screen bg-neutral-950">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            AI Research Agent
          </h1>
          <p className="mt-2 text-neutral-400">
            Submit research topics and get automated insights
          </p>
        </header>

        <div className="space-y-8">
          <ResearchForm onSubmit={handleNewSubmission} />

          {loading ? (
            <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-8 text-center">
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
