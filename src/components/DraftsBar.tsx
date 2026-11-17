import React, { useState, useRef, useEffect } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FolderGit2,
  GitBranch,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { AuthMode, WorkspaceDraft } from "../types";

interface DraftsBarProps {
  owner: string;
  repo: string;
  branch: string;
  createIfNotExist: boolean;
  isPrivate: boolean;
  authMode: AuthMode;
  commitMessage: string;
  lastSavedAt: number | null;
  savedDrafts: WorkspaceDraft[];
  onSaveNamedDraft: (name: string) => void;
  onLoadDraft: (draft: WorkspaceDraft) => void;
  onDeleteDraft: (id: string) => void;
  onResetCurrentDraft: () => void;
}

export default function DraftsBar({
  owner,
  repo,
  branch,
  createIfNotExist,
  isPrivate,
  authMode,
  commitMessage,
  lastSavedAt,
  savedDrafts,
  onSaveNamedDraft,
  onLoadDraft,
  onDeleteDraft,
  onResetCurrentDraft,
}: DraftsBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftNameInput, setDraftNameInput] = useState("");
  const [justSavedNotice, setJustSavedNotice] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "just now";
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackName = repo
      ? `${owner ? `${owner}/` : ""}${repo} (${branch || "main"})`
      : `Draft (${branch || "main"})`;
    const finalName = draftNameInput.trim() || fallbackName;
    onSaveNamedDraft(finalName);
    setDraftNameInput("");
    setJustSavedNotice(true);
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => setJustSavedNotice(false), 2500);
  };

  return (
    <section
      aria-label="Workspace Drafts"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm px-4 py-3 transition-all"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Live Auto-Saved Indicator & Summary */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-Save Draft</span>
            {lastSavedAt && (
              <span className="text-emerald-600/80 dark:text-emerald-400/80 font-mono text-[10px]">
                &bull; {formatTime(lastSavedAt)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-stone-600 dark:text-stone-400 min-w-0">
            <span className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md truncate max-w-[200px]">
              <FolderGit2 className="w-3 h-3 text-orange-500 shrink-0" />
              {repo ? `${owner ? `${owner}/` : ""}${repo}` : "No repo selected"}
              {createIfNotExist && " (new)"}
              {authMode === "ssh" && " [SSH]"}
              {isPrivate && " [private]"}
            </span>

            <span className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
              <GitBranch className="w-3 h-3 text-orange-500 shrink-0" />
              {branch || "main"}
            </span>

            <span
              className="hidden sm:inline-block truncate max-w-[220px] text-stone-500 dark:text-stone-400"
              title={commitMessage}
            >
              &ldquo;{commitMessage || "No commit message"}&rdquo;
            </span>
          </div>
        </div>

        {/* Draft Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <form onSubmit={handleSaveSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={draftNameInput}
              onChange={(e) => setDraftNameInput(e.target.value)}
              placeholder="Draft label (optional)"
              aria-label="Draft label"
              className="w-36 sm:w-40 px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-orange-500 transition"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Save current repository config, branch, and commit message as a named draft"
            >
              {justSavedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-orange-500" />
            <span>Drafts ({savedDrafts.length})</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onResetCurrentDraft}
            className="px-2.5 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg flex items-center gap-1 transition cursor-pointer"
            title="Clear active auto-saved draft back to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Saved Drafts List */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          {savedDrafts.length === 0 ? (
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono py-2 text-center">
              Your active session already auto-saves on every edit. Use &ldquo;Save Draft&rdquo; to bookmark additional presets here.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {savedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 flex items-start justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {draft.name}
                    </div>
                    <div className="text-[11px] font-mono text-stone-600 dark:text-stone-400 truncate">
                      {draft.repo ? `${draft.owner ? `${draft.owner}/` : ""}${draft.repo}` : "No repo"} &bull;{" "}
                      {draft.branch || "main"} ({draft.authMode.toUpperCase()})
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                      {draft.commitMessage}
                    </div>
                    <div className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatTime(draft.updatedAt)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadDraft(draft);
                        setIsOpen(false);
                      }}
                      className="px-2.5 py-1 bg-stone-900 dark:bg-stone-700 hover:bg-orange-600 dark:hover:bg-orange-600 text-white text-[11px] font-semibold rounded-md transition cursor-pointer"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDraft(draft.id)}
                      className="px-2.5 py-1 text-[11px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Delete saved draft"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
