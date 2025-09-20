"use client";

import { ResearchRequest } from "@/types";
import Link from "next/link";

interface ResearchListProps {
  requests: ResearchRequest[];
}

const statusConfig: Record<
  ResearchRequest["status"],
  {
    label: string;
    subtitle: string;
    badgeClass: string;
    dotClass: string;
    progressStep: number;
  }
> = {
  pending: {
    label: "Pending",
    subtitle: "Waiting on parsing",
    badgeClass: "bg-yellow-500/15 text-yellow-300",
    dotClass: "bg-yellow-400",
    progressStep: 1,
  },
  processing: {
    label: "Processing",
    subtitle: "In orchestration",
    badgeClass: "bg-blue-500/15 text-blue-300",
    dotClass: "bg-blue-400",
    progressStep: 3,
  },
  completed: {
    label: "Completed",
    subtitle: "Brief delivered",
    badgeClass: "bg-green-500/15 text-green-300",
    dotClass: "bg-green-400",
    progressStep: 5,
  },
  failed: {
    label: "Failed",
    subtitle: "Needs review",
    badgeClass: "bg-red-500/20 text-red-300",
    dotClass: "bg-red-400",
    progressStep: 3,
  },
};

const providerLabel = (provider: ResearchRequest["provider"]) =>
  provider === "openai" ? "OpenAI • GPT-4o" : "Anthropic • Claude";

const formatDate = (value: string) => {
  const date = new Date(value);
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function ResearchList({ requests }: ResearchListProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl bg-neutral-900/90 p-12 text-center shadow-xl">
        <h3 className="text-lg font-semibold text-white">
          Your research runway is clear
        </h3>
        <p className="mt-2 text-sm text-neutral-400">
          Submit a topic above and we&apos;ll populate this space with rich
          summaries, confidence scores, and source transparency.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Research history
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-neutral-500">
            {requests.length} {requests.length === 1 ? "project" : "projects"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => {
          const config = statusConfig[request.status];
          const progress = Math.min(1, Math.max(0, config.progressStep / 5));
          return (
            <Link
              key={request.id}
              href={`/research/${request.id}`}
              className="group relative block overflow-hidden rounded-2xl bg-neutral-900/90 p-1 shadow-xl transition hover:-translate-y-1 hover:bg-neutral-900"
            >
              <div className="relative z-10 rounded-2xl bg-neutral-900/70 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800/80">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400">
                        {request.topic}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-400">
                        {providerLabel(request.provider)}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.25em] text-neutral-500">
                        Requested {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex flex-col items-start gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${config.badgeClass}`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span
                          className={`h-2 w-2 rounded-full ${config.dotClass}`}
                        />
                        {config.label}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-[0.35em]">
                        {config.subtitle}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-neutral-500 transition group-hover:text-blue-400">
                      View
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="h-1.5 w-full rounded-full bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="rounded-full bg-neutral-800/80 px-3 py-1">
                      Step {config.progressStep} of 5
                    </span>
                    <span className="rounded-full bg-neutral-800/80 px-3 py-1">
                      ID {request.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
