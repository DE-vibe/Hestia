import React, { useState } from "react";
import { Sparkles, MessageSquare, Plus, Check, Loader2, FileText, AlertCircle } from "lucide-react";
import { UploadedFile } from "../types";

interface CommitControlsProps {
  files: UploadedFile[];
  onAddOrUpdateFile: (path: string, contentBase64: string, size: number) => void;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  isPremium: boolean;
  onUpgradeClick: () => void;
}

export default function CommitControls({
  files,
  onAddOrUpdateFile,
  commitMessage,
  setCommitMessage,
  isPremium,
  onUpgradeClick,
}: CommitControlsProps) {
  const [loadingAICommit, setLoadingAICommit] = useState(false);
  const [loadingAIReadme, setLoadingAIReadme] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [readmeSuccess, setReadmeSuccess] = useState(false);
  const [projectSummary, setProjectSummary] = useState("");

  // Handle AI suggestion for git commit messages
  const handleSuggestCommitMessage = async () => {
    if (!isPremium) {
      onUpgradeClick();
      return;
    }
    setLoadingAICommit(true);
    setAiError(null);
    try {
      // Send a list of top 30 files with content for small key files to help the AI understand
      const filesPayload = files
        .filter(f => f.selected)
        .slice(0, 30)
        .map(f => ({
          path: f.path,
          size: f.size,
          // Only send content of tiny config files to save token bandwidth
          content: f.path.includes("package.json") || f.path.includes("metadata.json") || f.path.includes("App.tsx") ? f.content : undefined
        }));

      const response = await fetch("/api/gemini/suggest-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesPayload,
          projectSummary: projectSummary,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to consult the AI Commit Architect");
      }

      const data = await response.json();
      setCommitMessage(data.commitMessage);
    } catch (err: any) {
      console.error(err);
      setAiError("Could not connect with AI Commit Architect. Please try typing manually.");
    } finally {
      setLoadingAICommit(false);
    }
  };

  // Handle AI README generation
  const handleGenerateReadme = async () => {
    if (!isPremium) {
      onUpgradeClick();
      return;
    }
    setLoadingAIReadme(true);
    setAiError(null);
    setReadmeSuccess(false);
    try {
      const filesPayload = files
        .filter(f => f.selected)
        .slice(0, 35)
        .map(f => ({
          path: f.path,
          size: f.size,
          content: f.path.includes("package.json") || f.path.includes("App.tsx") || f.path.includes("server.ts") ? f.content : undefined
        }));

      const response = await fetch("/api/gemini/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesPayload,
          projectName: projectSummary ? projectSummary.split("\n")[0].slice(0, 30) : "Hestia Project",
          projectDescription: projectSummary || "An awesome codebase pushed with Hestia Code Hearth",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to consult the Technical Writer AI");
      }

      const data = await response.json();
      const readmeMarkdown = data.readme;

      // Convert Markdown string to Base64
      const base64Content = btoa(unescape(encodeURIComponent(readmeMarkdown)));
      
      // Inject this file into the workspace files array!
      onAddOrUpdateFile("README.md", base64Content, readmeMarkdown.length);
      setReadmeSuccess(true);
      
      // Auto success banner timeout
      setTimeout(() => setReadmeSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setAiError("Failed to generate AI README. Please verify connection and try again.");
    } finally {
      setLoadingAIReadme(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5 relative overflow-hidden">
      {/* Visual Gold/Orange accent if premium */}
      {isPremium && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 animate-pulse" />
      )}

      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <h3 className="font-semibold text-stone-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Craft Commit Details
        </h3>
        {isPremium ? (
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-200" />
            Golden Premium Active
          </span>
        ) : (
          <button
            onClick={onUpgradeClick}
            className="text-[10px] uppercase font-bold tracking-wider text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-orange-500 fill-orange-200 animate-pulse" />
            Upgrade to use AI
          </button>
        )}
      </div>

      {/* Project brief summary input */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="brief" className="block text-xs font-medium text-stone-600">
            AI Context & Project Brief (Optional)
          </label>
          <span className="text-[10px] text-stone-400 font-medium">Guides the AI commit and README engine</span>
        </div>
        <textarea
          id="brief"
          rows={2}
          value={projectSummary}
          onChange={(e) => setProjectSummary(e.target.value)}
          placeholder="Briefly state what this project does or what changes you made. E.g., 'Bootstrap high-fidelity React social app with custom feeds and dark mode configurations.'"
          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-xs text-stone-800 transition placeholder-stone-400 resize-none leading-relaxed"
        />
      </div>

      {/* Commit message area */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="commit" className="block text-xs font-medium text-stone-600">
            Commit Message
          </label>
          <button
            type="button"
            onClick={handleSuggestCommitMessage}
            disabled={files.length === 0}
            className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition ${
              isPremium
                ? "text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200/50"
                : "text-stone-500 hover:text-orange-600 bg-stone-100 hover:bg-orange-50 border-stone-200"
            }`}
          >
            {loadingAICommit ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-orange-600" />
                Architecting...
              </>
            ) : (
              <>
                <Sparkles className={`w-3.5 h-3.5 ${isPremium ? "fill-orange-200 text-orange-500" : "text-stone-400"}`} />
                AI Suggest Message {!isPremium && "🔒"}
              </>
            )}
          </button>
        </div>
        
        <textarea
          id="commit"
          rows={4}
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Enter a descriptive commit message here (or let Hestia's AI draft one for you above)..."
          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-xs font-mono text-stone-800 transition placeholder-stone-400 leading-relaxed"
        />
      </div>

      {/* AI Readme Generator Trigger block */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/60 relative overflow-hidden">
          {!isPremium && (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500/10 to-transparent w-1/3 h-full pointer-events-none" />
          )}
          <div className="flex items-start gap-2.5">
            <FileText className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-950 flex items-center gap-1.5">
                Draft Professional AI README.md
                {!isPremium && <span className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold uppercase">🔒 AI Premium</span>}
              </h4>
              <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">
                Analyze this workspace structure to generate a comprehensive, highly-polished README for your repository automatically.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleGenerateReadme}
            disabled={files.length === 0}
            className={`sm:shrink-0 text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs font-semibold ${
              isPremium
                ? "text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-stone-300 bg-white"
                : "text-orange-700 hover:text-white bg-orange-50 hover:bg-orange-600 border border-orange-200/50"
            }`}
          >
            {loadingAIReadme ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-orange-500" />
                Add AI README.md {!isPremium && "🔒"}
              </>
            )}
          </button>
        </div>
        
        {readmeSuccess && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-100 rounded-xl text-green-700 text-xs">
            <Check className="w-4 h-4 text-green-600" />
            <span>Success! A beautiful, custom <strong>README.md</strong> has been compiled and added to your commit package!</span>
          </div>
        )}
      </div>

      {aiError && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{aiError}</span>
        </div>
      )}
    </div>
  );
}
