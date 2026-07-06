import React, { useState, useEffect } from "react";
import { GitCommit, Clock, ExternalLink, RefreshCw, AlertCircle, User, Calendar } from "lucide-react";
import { GithubCommit } from "../types";

interface RecentCommitsProps {
  token: string;
  owner: string;
  repo: string;
  refreshTrigger: number; // Increment to force refetch (e.g. after successful push)
}

export default function RecentCommits({ token, owner, repo, refreshTrigger }: RecentCommitsProps) {
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommits = async () => {
    if (!token || !owner || !repo) {
      setCommits([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, owner, repo }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch repository commits");
      }

      const data = await response.json();
      setCommits(data);
    } catch (err: any) {
      console.error("Failed to load commits:", err);
      setError(err.message || "Unable to fetch recent commits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits();
  }, [token, owner, repo, refreshTrigger]);

  if (!token || !owner || !repo) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800/80 mb-4">
          <GitCommit className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Recent Transmissions</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center text-stone-400 dark:text-stone-500">
          <Clock className="w-8 h-8 mb-2 opacity-60" />
          <p className="text-xs font-medium">No target repository active</p>
          <p className="text-[10px] mt-1">Select or configure a target repository above to monitor its commit history.</p>
        </div>
      </div>
    );
  }

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800/80">
        <div className="flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Recent Transmissions</h3>
          <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-md font-mono">
            Last 5
          </span>
        </div>
        
        <button
          onClick={fetchCommits}
          disabled={loading}
          className="p-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition disabled:opacity-50 cursor-pointer"
          title="Refresh commits history"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to fetch history</p>
            <p className="text-[10px] mt-0.5 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={fetchCommits}
            className="text-[10px] font-bold uppercase tracking-wider text-red-800 hover:text-red-950 dark:text-red-400 dark:hover:text-red-350 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : loading && commits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-stone-400 dark:text-stone-500">
          <RefreshCw className="w-6 h-6 mb-2 animate-spin text-orange-500" />
          <p className="text-xs font-medium">Fetching commit history...</p>
        </div>
      ) : commits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-stone-400 dark:text-stone-500">
          <GitCommit className="w-8 h-8 mb-2 opacity-50 text-orange-400 animate-pulse" />
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">No transmissions recorded</p>
          <p className="text-[10px] mt-1 max-w-xs leading-relaxed">
            This repository is currently empty or has no commits on the selected branch. Ignite the hearth to push your first commit!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800/60 max-h-[350px] overflow-y-auto pr-1">
          {commits.map((commit) => {
            // Split commit message to show title and description nicely
            const lines = commit.message.split("\n");
            const title = lines[0] || "";
            const body = lines.slice(1).join("\n").trim();

            return (
              <div key={commit.sha} className="py-3 first:pt-0 last:pb-0 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 break-words leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {title}
                    </h4>
                    {body && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono whitespace-pre-wrap leading-relaxed truncate max-h-[40px]">
                        {body}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500 pt-0.5">
                      <div className="flex items-center gap-1 shrink-0">
                        {commit.author.avatar_url ? (
                          <img
                            src={commit.author.avatar_url}
                            alt={commit.author.login || commit.author.name}
                            className="w-3.5 h-3.5 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span className="font-semibold text-stone-600 dark:text-stone-300">
                          {commit.author.login || commit.author.name}
                        </span>
                      </div>
                      <span className="shrink-0">&bull;</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(commit.author.date)}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-stone-50 hover:bg-orange-50 dark:bg-stone-800/50 dark:hover:bg-orange-950/20 border border-stone-200 dark:border-stone-800 hover:border-orange-200 dark:hover:border-orange-900/30 rounded-lg text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0"
                    title="View commit details on GitHub"
                  >
                    <span>{commit.sha.substring(0, 7)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
