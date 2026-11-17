import React, { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Flame, FileArchive, HelpCircle, AlertCircle, Loader2, UploadCloud } from "lucide-react";
import { UploadedFile } from "../types";

interface HearthUploadProps {
  onFilesLoaded: (files: UploadedFile[], zipName: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const slice = bytes.subarray(i, i + CHUNK_SIZE);
    chunks.push(String.fromCharCode(...slice));
  }
  return btoa(chunks.join(""));
}

function isDefaultIgnoredPath(relativePath: string): boolean {
  const segments = relativePath
    .toLowerCase()
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  return segments.some(
    (seg) =>
      seg === "node_modules" ||
      seg === "dist" ||
      seg === ".next" ||
      seg === ".git" ||
      seg === ".ds_store" ||
      seg === ".env" ||
      seg.startsWith(".env.") ||
      seg === "build" ||
      seg === "out"
  );
}

export default function HearthUpload({
  onFilesLoaded,
  isLoading,
  setIsLoading,
}: HearthUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const processZipFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(file);
      const extractedFiles: UploadedFile[] = [];

      // Check if it's actually an empty zip
      if (Object.keys(zip.files).length === 0) {
        throw new Error("The uploaded ZIP file appears to be empty.");
      }

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue; // Skip directories, paths are stored in files

        const isIgnored = isDefaultIgnoredPath(relativePath);

        // Read uncompressed bytes once and encode base64 from it
        const u8Array = await zipEntry.async("uint8array");
        const size = u8Array.length;
        const contentBase64 = uint8ArrayToBase64(u8Array);

        extractedFiles.push({
          name: relativePath.split("/").pop() || "",
          path: relativePath,
          content: contentBase64,
          size,
          selected: !isIgnored,
        });
      }

      if (extractedFiles.length === 0) {
        throw new Error("No files were found inside the uploaded ZIP archive (only folders present).");
      }

      onFilesLoaded(extractedFiles, file.name);
    } catch (err: any) {
      setError(err.message || "Failed to parse the ZIP file. Please verify it is a valid ZIP package.");
    } finally {
      setIsLoading(false);
    }
  }, [onFilesLoaded, setIsLoading]);

  const onDropAccepted = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await processZipFile(acceptedFiles[0]);
      }
    },
    [processZipFile]
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const firstError = fileRejections[0]?.errors[0];
    if (firstError?.code === "too-many-files") {
      setError("Please upload one .zip package at a time.");
      return;
    }
    setError("Hestia works with code packages! Please upload a valid .zip file (such as your AI Studio export).");
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: {
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
      "multipart/x-zip": [".zip"],
    },
    multiple: false,
    disabled: isLoading,
    onDragEnter: undefined,
    onDragOver: undefined,
    onDragLeave: undefined,
  });

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800/80">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">Gather the Hearth Kindling</h2>
        </div>
        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded-lg">
          ZIP Dropzone Ready
        </span>
      </div>

      <div
        {...getRootProps({
          id: "hearth-drag-form",
          "aria-label": "Upload ZIP package dropzone",
        })}
        className={`w-full group relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
          isLoading
            ? "border-orange-300 dark:border-orange-800 bg-stone-50/70 dark:bg-stone-950/30 cursor-wait"
            : isDragReject
            ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 scale-[0.99]"
            : isDragAccept || isDragActive
            ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 scale-[0.99] shadow-inner"
            : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/25 hover:bg-stone-50/90 dark:hover:bg-stone-950/40 hover:border-orange-400"
        }`}
      >
        <input {...getInputProps()} id="input-file-upload" />

        {/* Flame hearth glowing background effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />

        {isLoading ? (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Feeding code to Hestia...</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">Unpacking and analyzing package contents</p>
          </div>
        ) : isDragReject ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-500 mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Unsupported file format
            </h3>
            <p className="text-xs text-red-600/80 dark:text-red-300/80 max-w-sm mt-1.5 leading-relaxed">
              Only <code className="font-mono">.zip</code> packages are accepted in the Hearth dropzone.
            </p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-700 rounded-2xl shadow-sm text-orange-600 dark:text-orange-400 scale-110 transition-transform mb-4">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              Drop your ZIP package to ignite
            </h3>
            <p className="text-xs text-orange-600/80 dark:text-orange-300/80 max-w-sm mt-1.5 leading-relaxed">
              Release to unpack and inspect files before pushing to GitHub.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-sm text-orange-500 group-hover:text-orange-600 group-hover:scale-110 group-hover:border-orange-200 dark:group-hover:border-orange-500/50 transition-all duration-300 mb-4">
              <FileArchive className="w-8 h-8" />
            </div>

            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-orange-600 transition-colors">
              Drag and drop your AI Studio export ZIP
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1.5 leading-relaxed">
              Download your workspace ZIP from AI Studio, or compress your local project folder, and drop it here to fuel the hearth.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className="mt-4 px-4 py-2 bg-white dark:bg-stone-800 hover:bg-orange-50 dark:hover:bg-orange-950/10 border border-stone-200 dark:border-stone-700 hover:border-orange-200 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 transition shadow-xs cursor-pointer"
            >
              Select .zip from device
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full mt-4 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-xs leading-relaxed">
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
