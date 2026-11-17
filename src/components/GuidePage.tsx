import React from "react";
import { Flame, ArrowRight, FolderUp, KeyRound, GitBranch, ShieldCheck, ChevronRight, Home } from "lucide-react";
import { GithubProfile } from "../types";
import GitHubStatusBadge, { GitHubConnectionStatus } from "./GitHubStatusBadge";

interface GuidePageProps {
  onNavigate: (path: string) => void;
  profile?: GithubProfile | null;
  authStatus?: GitHubConnectionStatus;
}

export default function GuidePage({ onNavigate, profile = null, authStatus = "disconnected" }: GuidePageProps) {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 flex flex-col">
      {/* Header with Internal Links */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-4 px-6 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, "/")}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 text-white fill-white/10" />
            </div>
            <span className="font-black text-base tracking-tight uppercase text-stone-950 dark:text-stone-50 group-hover:text-orange-600 transition-colors">
              Hestia Code Hearth
            </span>
          </a>

          <nav aria-label="Primary Navigation" className="flex items-center gap-2 text-xs font-semibold">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, "/")}
              className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Home
            </a>
            <a
              href="/workspace"
              onClick={(e) => handleLinkClick(e, "/workspace")}
              className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Workspace
            </a>
            <a
              href="/guide"
              onClick={(e) => handleLinkClick(e, "/guide")}
              aria-current="page"
              className="px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800/60"
            >
              Guide
            </a>
            <GitHubStatusBadge
              profile={profile}
              status={authStatus}
              onClick={() => onNavigate("/workspace")}
            />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-stone-500 dark:text-stone-400">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, "/")}
            className="inline-flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 dark:text-stone-100 font-semibold">Deployment Guide</span>
        </nav>

        <section className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950 dark:text-white">
            How to Push Your Codebase with Hestia
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
            Follow this three-step workflow to bundle any AI Studio export or local ZIP package, filter unwanted dependencies, and publish straight to GitHub.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-stone-950 dark:text-stone-50">1. Connect GitHub</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Authenticate using a GitHub Personal Access Token (<code className="font-mono">repo</code> scope) or switch to SSH Deploy Key mode for isolated repository access.
            </p>
          </article>

          <article className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <FolderUp className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-stone-950 dark:text-stone-50">2. Drop Your ZIP</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Upload an exported ZIP archive in the{" "}
              <a
                href="/workspace"
                onClick={(e) => handleLinkClick(e, "/workspace")}
                className="text-orange-600 dark:text-orange-400 underline underline-offset-2 font-semibold"
              >
                Hestia Workspace
              </a>
              . Bulky folders like <code className="font-mono">node_modules</code> and <code className="font-mono">dist</code> are filtered automatically.
            </p>
          </article>

          <article className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-stone-950 dark:text-stone-50">3. Ignite &amp; Commit</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Choose an existing repository or create a new one, pick your target branch, customize your commit message, and ignite your push in seconds.
            </p>
          </article>
        </div>

        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Client-Side Package Processing
            </div>
            <h2 className="text-lg font-bold text-stone-950 dark:text-white">Ready to push your project?</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Open the interactive workspace to inspect your ZIP files and publish straight to GitHub.
            </p>
          </div>
          <a
            href="/workspace"
            onClick={(e) => handleLinkClick(e, "/workspace")}
            className="shrink-0 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 shadow-sm transition"
          >
            Open Workspace
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </main>

      <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-6 px-6 text-center">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-stone-500">
          <a href="/" onClick={(e) => handleLinkClick(e, "/")} className="hover:text-orange-600 transition">
            Home
          </a>
          <span>&bull;</span>
          <a href="/workspace" onClick={(e) => handleLinkClick(e, "/workspace")} className="hover:text-orange-600 transition">
            Workspace
          </a>
          <span>&bull;</span>
          <a href="/guide" onClick={(e) => handleLinkClick(e, "/guide")} className="hover:text-orange-600 transition">
            Guide
          </a>
        </div>
      </footer>
    </div>
  );
}
