"use client";

import { ResearchRequest } from "@/types";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { JSX } from "react";

interface ResearchListProps {
  requests: ResearchRequest[];
}

const statusConfig: Record<
  ResearchRequest["status"],
  {
    label: string;
    subtitle: string;
    badgeClass: string;
    icon: JSX.Element;
    progressStep: number;
  }
> = {
  pending: {
    label: "Pending",
    subtitle: "Waiting on parsing",
    badgeClass: "border-yellow-600 bg-yellow-500/10 text-yellow-400",
    icon: <Clock className="h-4 w-4 text-yellow-400" />,
    progressStep: 1,
  },
  processing: {
    label: "Processing",
    subtitle: "In orchestration",
    badgeClass: "border-blue-600 bg-blue-500/10 text-blue-400",
    icon: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
    progressStep: 3,
  },
  completed: {
    label: "Completed",
    subtitle: "Brief delivered",
    badgeClass: "border-green-600 bg-green-500/10 text-green-400",
    icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
    progressStep: 5,
  },
  failed: {
    label: "Failed",
    subtitle: "Needs review",
    badgeClass: "border-red-600 bg-red-500/10 text-red-400",
    icon: <XCircle className="h-4 w-4 text-red-400" />,
    progressStep: 3,
  },
};

const providerLabel = (provider?: ResearchRequest["provider"]) => {
  if (provider === "openai") return "OpenAI • GPT-4o";
  if (provider === "anthropic") return "Anthropic • Claude";
  return "System default";
};

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
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800">
          <Sparkles className="h-6 w-6 text-blue-400" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-white">
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
              className="group relative block overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 transition hover:border-neutral-600 hover:bg-neutral-800"
            >
              <div className="relative z-10 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800">
                      {config.icon}
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
                      className={`inline-flex flex-col items-start gap-1 rounded-xl border px-3 py-2 text-xs font-semibold ${config.badgeClass}`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        {config.icon}
                        {config.label}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-[0.35em]">
                        {config.subtitle}
                      </span>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-neutral-500 transition group-hover:text-blue-400" />
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
                    <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1">
                      Step {config.progressStep} of 5
                    </span>
                    <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1">
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
