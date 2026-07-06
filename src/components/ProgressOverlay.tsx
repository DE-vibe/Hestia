import React from "react";
import { Flame, Loader2, CheckCircle, XCircle, ArrowRight, Github, ExternalLink } from "lucide-react";
import { PushStatus } from "../types";

interface ProgressOverlayProps {
  status: PushStatus;
  totalFiles: number;
  onDismiss: () => void;
}

export default function ProgressOverlay({
  status,
  totalFiles,
  onDismiss,
}: ProgressOverlayProps) {
  if (status.stage === "idle") return null;

  // Map stages to human-friendly description
  const getStageMessage = () => {
    switch (status.stage) {
      case "preparing":
        return {
          title: "Aligning Hearth Logs...",
          desc: "Connecting to GitHub, validating credentials, and checking target repository state.",
          color: "text-amber-500",
        };
      case "blobs":
        return {
          title: "Stoking the Fire...",
          desc: `Uploading files to GitHub. Creating code blobs (${status.progress.toFixed(0)}% complete).`,
          sub: status.currentFile ? `Uploading: ${status.currentFile}` : undefined,
          color: "text-orange-500",
        };
      case "tree":
        return {
          title: "Forging the Branches...",
          desc: "Structuring the file hierarchy and updating directory trees on GitHub.",
          color: "text-orange-600",
        };
      case "commit":
        return {
          title: "Igniting the Commit Spark...",
          desc: "Signing the commit payload and creating the new git commit history.",
          color: "text-red-500",
        };
      case "ref":
        return {
          title: "Guiding the Spark Home...",
          desc: `Pointing target branch heads to the newly minted commit history.`,
          color: "text-red-600",
        };
      case "success":
        return {
          title: "The Hearth Glows!",
          desc: "Your codebase has been successfully stowed, stoked, and pushed to its new home on GitHub!",
          color: "text-green-600",
        };
      case "error":
        return {
          title: "The Fire Flickered Out...",
          desc: "An error interrupted the commit pushing workflow.",
          color: "text-red-600",
        };
      default:
        return {
          title: "Stoking...",
          desc: "Processing push payload.",
          color: "text-orange-500",
        };
    }
  };

  const stage = getStageMessage();

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden relative p-8 flex flex-col items-center text-center transition-all duration-300">
        
        {/* Decorative Hearth Light Beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

        {/* Status Graphic Section */}
        <div className="mb-6 relative">
          {status.stage === "success" ? (
            <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-450 rounded-full flex items-center justify-center scale-110 transition-transform shadow-sm animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>
          ) : status.stage === "error" ? (
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-450 rounded-full flex items-center justify-center scale-110 transition-transform shadow-sm animate-pulse">
              <XCircle className="w-9 h-9" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Outer spinning ring */}
              <div className="absolute w-20 h-20 border-4 border-dashed border-orange-500/20 rounded-full animate-spin [animation-duration:8s]" />
              {/* Core flame icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-orange-200/60 dark:border-orange-900/30 rounded-2xl flex items-center justify-center shadow-xs">
                <Flame className="w-8 h-8 text-orange-500 fill-orange-400 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Text Details */}
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          {stage.title}
        </h3>
        
        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4 max-w-sm">
          {stage.desc}
        </p>

        {/* Inner details / Subtext */}
        {status.stage !== "success" && status.stage !== "error" && (
          <div className="w-full bg-stone-50 dark:bg-stone-850 border border-stone-100 dark:border-stone-800 rounded-xl p-3 mb-6 min-h-[50px] flex flex-col justify-center">
            {stage.sub ? (
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 break-all truncate block">
                {stage.sub}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                Processing Git State
              </span>
            )}
          </div>
        )}

        {/* Progress bar (applicable to blobs) */}
        {status.stage === "blobs" && (
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        )}

        {/* Error Details */}
        {status.stage === "error" && (
          <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-xl p-4 text-xs text-left mb-6 font-mono leading-relaxed max-h-[160px] overflow-y-auto">
            <span className="font-bold block mb-1">Error Message:</span>
            <span>{status.error || "An unknown internal error occurred."}</span>
          </div>
        )}

        {/* Successful Push Actions */}
        {status.stage === "success" && (
          <div className="w-full flex flex-col gap-2.5 mb-2 mt-2">
            {status.resultUrl && (
              <a
                href={status.resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-stone-950 dark:bg-stone-800 hover:bg-stone-850 dark:hover:bg-stone-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Github className="w-4 h-4" />
                Explore Repository on GitHub
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}
            
            <button
              onClick={onDismiss}
              className="w-full py-3 px-4 border border-stone-200 dark:border-stone-750 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm rounded-xl transition cursor-pointer"
            >
              Return to Hearth Dashboard
            </button>
          </div>
        )}

        {/* Error / Loading Actions */}
        {status.stage === "error" && (
          <button
            onClick={onDismiss}
            className="w-full py-2.5 px-4 bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer"
          >
            Dismiss & Resolve Parameters
          </button>
        )}
      </div>
    </div>
  );
}
