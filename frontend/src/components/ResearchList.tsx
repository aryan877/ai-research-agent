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
    badgeClass: string;
    icon: JSX.Element;
  }
> = {
  pending: {
    label: "Pending",
    badgeClass: "border-amber-400/40 bg-amber-500/10 text-amber-200",
    icon: <Clock className="h-4 w-4 text-amber-300" />,
  },
  processing: {
    label: "Processing",
    badgeClass: "border-sky-400/40 bg-sky-500/10 text-sky-200",
    icon: <Loader2 className="h-4 w-4 animate-spin text-sky-300" />,
  },
  completed: {
    label: "Completed",
    badgeClass: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
  },
  failed: {
    label: "Failed",
    badgeClass: "border-rose-400/40 bg-rose-500/10 text-rose-200",
    icon: <XCircle className="h-4 w-4 text-rose-300" />,
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
      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-12 text-center shadow-xl shadow-blue-500/10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-950/70">
          <Sparkles className="h-6 w-6 text-blue-300" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-white">
          Your research runway is clear
        </h3>
        <p className="mt-2 text-sm text-slate-300">
          Submit a topic above and we&apos;ll populate this space with rich
          summaries, confidence scores, and source transparency.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Research history</h2>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {requests.length} {requests.length === 1 ? "project" : "projects"}
        </p>
      </div>

      <div className="space-y-4">
        {requests.map((request) => {
          const config = statusConfig[request.status];
          return (
            <Link
              key={request.id}
              href={`/research/${request.id}`}
              className="group relative block overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/10 transition hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-blue-500/20"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60">
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-200">
                      {request.topic}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {providerLabel(request.provider)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      Requested {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${config.badgeClass}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:text-blue-300" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
