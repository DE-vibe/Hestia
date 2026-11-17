import React from "react";
import { GithubProfile } from "../types";

export type GitHubConnectionStatus = "active" | "reauth" | "checking" | "disconnected";

interface GitHubStatusBadgeProps {
  profile: GithubProfile | null;
  status: GitHubConnectionStatus;
  onClick?: () => void;
  variant?: "light" | "dark";
}

export default function GitHubStatusBadge({
  profile,
  status,
  onClick,
  variant = "light",
}: GitHubStatusBadgeProps) {
  const isDarkSurface = variant === "dark";

  if (status === "active" && profile) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`GitHub Connected: ${profile.name || profile.login} (@${profile.login})`}
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
          isDarkSurface
            ? "bg-stone-900/90 border-emerald-500/30 text-stone-200 hover:border-emerald-500/60"
            : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 hover:border-emerald-300 dark:hover:border-emerald-700"
        }`}
      >
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={`Avatar for ${profile.name || profile.login}`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = "/favicon.svg";
            }}
            className="w-4 h-4 rounded-full object-cover border border-emerald-500/40 shrink-0"
          />
        )}
        <span className="font-semibold text-[11px] leading-none">Active</span>
        <span
          className={`text-[10px] font-mono leading-none hidden md:inline ${
            isDarkSurface ? "text-stone-400" : "text-emerald-700 dark:text-emerald-300/90"
          }`}
        >
          @{profile.login}
        </span>
      </button>
    );
  }

  if (status === "reauth") {
    return (
      <button
        type="button"
        onClick={onClick}
        title="GitHub token expired or invalid. Click to re-authenticate."
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
          isDarkSurface
            ? "bg-yellow-950/50 border-yellow-500/40 text-yellow-200 hover:border-yellow-400"
            : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700/70 text-yellow-900 dark:text-yellow-200 hover:border-yellow-400"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" aria-hidden="true" />
        <span className="font-semibold text-[11px] leading-none">Re-auth required</span>
        {profile?.login && (
          <span className="text-[10px] font-mono opacity-80 leading-none hidden md:inline">
            @{profile.login}
          </span>
        )}
      </button>
    );
  }

  if (status === "checking") {
    return (
      <span
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium ${
          isDarkSurface
            ? "bg-stone-900/70 border-stone-800 text-stone-300"
            : "bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-mono leading-none">Checking GitHub...</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Connect a GitHub account in the workspace"
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
        isDarkSurface
          ? "bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
          : "bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-stone-400 dark:bg-stone-500 shrink-0" aria-hidden="true" />
      <span className="text-[11px] leading-none">Not connected</span>
    </button>
  );
}
