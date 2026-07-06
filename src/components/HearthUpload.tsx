import React, { useState, useRef } from "react";
import { Flame, Upload, FileArchive, Check, HelpCircle, AlertCircle, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { UploadedFile } from "../types";

interface HearthUploadProps {
  onFilesLoaded: (files: UploadedFile[], zipName: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function HearthUpload({
  onFilesLoaded,
  isLoading,
  setIsLoading,
}: HearthUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processZipFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const zip = await JSZip.loadAsync(file);
      const extractedFiles: UploadedFile[] = [];

      // Check if it's actually an empty zip
      if (Object.keys(zip.files).length === 0) {
        throw new Error("The uploaded ZIP file appears to be empty.");
      }

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue; // Skip directories, paths are stored in files

        // Standard exclusions for developer sanity
        const pathLower = relativePath.toLowerCase();
        const isIgnored = 
          pathLower.includes("node_modules/") ||
          pathLower.includes("dist/") ||
          pathLower.includes(".next/") ||
          pathLower.includes(".git/") ||
          pathLower.includes(".ds_store") ||
          pathLower.includes(".env") ||
          pathLower.includes("build/") ||
          pathLower.includes("out/");

        // Read content in base64 format for safe transmission to GitHub
        const contentBase64 = await zipEntry.async("base64");
        
        // Retrieve size
        // fallback in case of internal changes, but async("uint8array") is safe
        const u8Array = await zipEntry.async("uint8array");
        const size = u8Array.length;

        extractedFiles.push({
          name: relativePath.split("/").pop() || "",
          path: relativePath,
          content: contentBase64,
          size: size,
          selected: !isIgnored,
        });
      }

      onFilesLoaded(extractedFiles, file.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse the ZIP file. Please verify it is a valid ZIP package.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".zip") || file.type === "application/zip") {
        await processZipFile(file);
      } else {
        setError("Hestia works with code packages! Please upload a .zip file (such as your AI Studio export).");
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processZipFile(file);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800/80">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Gather the Hearth Kindling</h3>
        </div>
        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded-lg">
          ZIP Package Upload
        </span>
      </div>

      <form
        id="hearth-drag-form"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="w-full"
      >
        <input
          ref={fileInputRef}
          type="file"
          id="input-file-upload"
          className="hidden"
          accept=".zip"
          onChange={handleChange}
          disabled={isLoading}
        />

        <div
          onClick={onButtonClick}
          className={`group relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-orange-500 bg-orange-50/30 scale-[0.99]"
              : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/25 hover:bg-stone-50/90 dark:hover:bg-stone-950/40 hover:border-orange-400"
          }`}
        >
          {/* Flame hearth glowing background effect on hover */}
          <div className="absolute inset-0 bg-radial-gradient from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />

          {isLoading ? (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Feeding code to Hestia...</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">Unpacking and analyzing package contents</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-sm text-orange-500 group-hover:text-orange-600 group-hover:scale-110 group-hover:border-orange-200 dark:group-hover:border-orange-500/50 transition-all duration-300 mb-4">
                <FileArchive className="w-8 h-8" />
              </div>
              
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-orange-600 transition-colors">
                Drag and drop your AI Studio export ZIP
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1.5 leading-relaxed">
                Download your workspace ZIP from AI Studio, or compress your local project folder, and drop it here to fuel the hearth.
              </p>
              
              <span className="mt-4 px-4 py-2 bg-white dark:bg-stone-800 hover:bg-orange-50 dark:hover:bg-orange-950/10 border border-stone-200 dark:border-stone-750 hover:border-orange-200 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 transition shadow-xs">
                Select .zip from device
              </span>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="w-full mt-4 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-750 dark:text-red-400 text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Upload failed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Helpful Hint banner */}
      <div className="w-full mt-4 bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20 rounded-xl p-3.5 flex items-start gap-3">
        <HelpCircle className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          <span className="font-semibold text-orange-800 dark:text-orange-400">How to export from AI Studio:</span> Open your AI Studio app project, open the settings/export menu (top-right gear icon or export options), select "Export to ZIP", download the ZIP package, and upload it right here.
        </div>
      </div>
    </div>
  );
}
