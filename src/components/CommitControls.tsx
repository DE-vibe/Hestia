import React, { useState } from "react";
import {
  MessageSquare,
  Plus,
  Check,
  FileText,
  Sparkles,
  Loader2,
  Github,
  CheckCircle2,
  FileCode,
  Zap,
  Wand2,
  Sliders,
  RefreshCw,
  Info,
} from "lucide-react";
import { UploadedFile } from "../types";

interface CommitControlsProps {
  files: UploadedFile[];
  onAddOrUpdateFile: (path: string, contentBase64: string, size: number) => void;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  token?: string;
  isPremium: boolean;
  onUpgradeClick: () => void;
}

export default function CommitControls({
  files,
  onAddOrUpdateFile,
  commitMessage,
  setCommitMessage,
  token,
  isPremium,
  onUpgradeClick,
}: CommitControlsProps) {
  const [showAddReadme, setShowAddReadme] = useState(false);
  const [customReadmeText, setCustomReadmeText] = useState("");
  const [readmeSuccess, setReadmeSuccess] = useState(false);

  // Smart Commit Mode & Copilot State
  const [commitMode, setCommitMode] = useState<"standard" | "smart">("smart");
  const [smartCommitStyle, setSmartCommitStyle] = useState<"conventional" | "concise" | "detailed">("conventional");
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotSource, setCopilotSource] = useState<string | null>(null);
  const [copilotSummary, setCopilotSummary] = useState<string | null>(null);
  const [prDescription, setPrDescription] = useState<string | null>(null);
  const [prAttachedNotice, setPrAttachedNotice] = useState(false);

  const handleAddCustomReadme = () => {
    if (!customReadmeText.trim()) return;
    const base64Content = btoa(unescape(encodeURIComponent(customReadmeText)));
    onAddOrUpdateFile("README.md", base64Content, customReadmeText.length);
    setReadmeSuccess(true);
    setShowAddReadme(false);
    setTimeout(() => setReadmeSuccess(false), 5000);
  };

  const handleSuggestCopilotCommit = async (overrideStyle?: "conventional" | "concise" | "detailed") => {
    if (files.length === 0) {
      alert("Please upload or select at least one file to analyze with GitHub Copilot.");
      return;
    }

    setIsCopilotLoading(true);
    setCopilotSource(null);
    setCopilotSummary(null);

    try {
      const selectedFiles = files.filter((f) => f.selected);
      const targetFiles = selectedFiles.length > 0 ? selectedFiles : files;

      const res = await fetch("/api/copilot/suggest-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || "",
          files: targetFiles.map((f) => ({ path: f.path, content: f.content })),
          style: overrideStyle || smartCommitStyle,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate Copilot commit suggestion");
      }

      const data = await res.json();
      if (data.commitMessage) {
        setCommitMessage(data.commitMessage);
      }
      if (data.source) {
        setCopilotSource(data.source);
      }
      if (data.summary) {
        setCopilotSummary(data.summary);
      }
      if (data.prDescription) {
        setPrDescription(data.prDescription);
      }
    } catch (err) {
      console.error("Copilot suggestion failed:", err);
      alert("Could not generate Copilot commit message right now. Please try again or type manually.");
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleAttachPrDescription = () => {
    if (!prDescription) return;
    const base64Content = btoa(unescape(encodeURIComponent(prDescription)));
    onAddOrUpdateFile("PR_DESCRIPTION.md", base64Content, prDescription.length);
    setPrAttachedNotice(true);
    setTimeout(() => setPrAttachedNotice(false), 5000);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 space-y-5 relative overflow-hidden">
      {/* Visual Gold/Orange accent if premium */}
      {isPremium && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 animate-pulse" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Craft Commit Details
        </h3>

        {/* Tab Toggle: Standard vs Smart Commit (GitHub Copilot) */}
        <div className="inline-flex p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700">
          <button
            type="button"
            onClick={() => setCommitMode("standard")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              commitMode === "standard"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Standard
          </button>

          <button
            type="button"
            onClick={() => {
              setCommitMode("smart");
              if (!commitMessage && files.length > 0) {
                handleSuggestCopilotCommit();
              }
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              commitMode === "smart"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                : "text-purple-600 dark:text-purple-400 hover:text-purple-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
            Smart Commit (Copilot AI)
          </button>
        </div>
      </div>

      {/* Smart Commit Copilot Banner when Smart Mode active */}
      {commitMode === "smart" && (
        <div className="p-4 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800/40 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>GitHub Copilot Automated Commit AI</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-semibold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Analyzes your staged file diffs and writes standard conventional commit messages & PR notes.
                </p>
              </div>
            </div>

            {/* Re-analyze / Generate button */}
            <button
              type="button"
              onClick={() => handleSuggestCopilotCommit()}
              disabled={isCopilotLoading || files.length === 0}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isCopilotLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Diffs...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-analyze Diffs</span>
                </>
              )}
            </button>
          </div>

          {/* Style Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-200/50 dark:border-purple-900/30">
            <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-purple-500" />
              Format:
            </span>

            <button
              type="button"
              onClick={() => {
                setSmartCommitStyle("conventional");
                handleSuggestCopilotCommit("conventional");
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                smartCommitStyle === "conventional"
                  ? "bg-purple-600 text-white font-semibold"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100"
              }`}
            >
              Conventional (feat/fix)
            </button>

            <button
              type="button"
              onClick={() => {
                setSmartCommitStyle("concise");
                handleSuggestCopilotCommit("concise");
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                smartCommitStyle === "concise"
                  ? "bg-purple-600 text-white font-semibold"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100"
              }`}
            >
              Concise Short
            </button>

            <button
              type="button"
              onClick={() => {
                setSmartCommitStyle("detailed");
                handleSuggestCopilotCommit("detailed");
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                smartCommitStyle === "detailed"
                  ? "bg-purple-600 text-white font-semibold"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100"
              }`}
            >
              Detailed Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Commit message input area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="commit" className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Commit Message
          </label>

          {commitMode === "standard" && (
            <button
              type="button"
              onClick={() => handleSuggestCopilotCommit()}
              disabled={isCopilotLoading || files.length === 0}
              className="text-xs px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold rounded-lg transition flex items-center gap-1 border border-purple-200 dark:border-purple-800 cursor-pointer"
            >
              {isCopilotLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              )}
              <span>Auto-Fill with Copilot</span>
            </button>
          )}
        </div>

        <textarea
          id="commit"
          rows={4}
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Enter a descriptive commit message for your GitHub push (e.g., 'feat: bootstrap application structure')..."
          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-xs font-mono text-stone-800 dark:text-stone-100 transition placeholder-stone-400 leading-relaxed"
        />

        {/* Copilot Source & Summary Badge */}
        {copilotSource && (
          <div className="p-3 bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 font-mono">
                <Github className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Engine: {copilotSource.includes("copilot") ? "GitHub Copilot (gpt-4o)" : "Gemini AI Assistant"}
              </span>

              {prDescription && (
                <button
                  type="button"
                  onClick={handleAttachPrDescription}
                  className="text-[11px] font-medium text-purple-700 hover:text-purple-900 dark:text-purple-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <FileCode className="w-3 h-3" />
                  Attach PR_DESCRIPTION.md
                </button>
              )}
            </div>

            {copilotSummary && (
              <div className="text-[11px] text-purple-900/80 dark:text-purple-300/80 font-mono leading-relaxed whitespace-pre-line">
                {copilotSummary}
              </div>
            )}
          </div>
        )}

        {prAttachedNotice && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-xl text-green-700 dark:text-green-400 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>PR_DESCRIPTION.md generated by Copilot attached to commit package!</span>
          </div>
        )}
      </div>

      {/* Custom Readme Generator / Addition Section */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/60 dark:border-stone-800 relative overflow-hidden">
          <div className="flex items-start gap-2.5">
            <FileText className="w-5 h-5 text-stone-600 dark:text-stone-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-950 dark:text-stone-100">
                Add Custom README.md
              </h4>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                Include a custom documentation file in your commit package.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddReadme(!showAddReadme)}
            className="sm:shrink-0 text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-orange-500" />
            {showAddReadme ? "Close Editor" : "Add README.md"}
          </button>
        </div>

        {showAddReadme && (
          <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl space-y-2">
            <textarea
              rows={5}
              value={customReadmeText}
              onChange={(e) => setCustomReadmeText(e.target.value)}
              placeholder="# My Project&#10;&#10;Write markdown documentation here..."
              className="w-full p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={handleAddCustomReadme}
              disabled={!customReadmeText.trim()}
              className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
            >
              Attach README to Package
            </button>
          </div>
        )}

        {readmeSuccess && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40 rounded-xl text-green-700 dark:text-green-400 text-xs">
            <Check className="w-4 h-4 text-green-600" />
            <span>Success! <strong>README.md</strong> has been added to your commit package!</span>
          </div>
        )}
      </div>
    </div>
  );
}


