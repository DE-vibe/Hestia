import React, { useState, useMemo } from "react";
import { FolderTree, Search, File, CheckSquare, Square, Check, RefreshCw, Layers, FileCode2, FileJson, FileText, Settings, ShieldAlert, FileCode } from "lucide-react";
import { UploadedFile } from "../types";

interface ZipInspectorProps {
  files: UploadedFile[];
  onFilesChanged: (files: UploadedFile[]) => void;
  zipName: string;
  onReset: () => void;
}

export default function ZipInspector({
  files,
  onFilesChanged,
  zipName,
  onReset,
}: ZipInspectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate file count and total size of selected files
  const stats = useMemo(() => {
    let totalFiles = files.length;
    let selectedFilesCount = 0;
    let totalSelectedSize = 0;
    let ignoredCount = 0;

    files.forEach((f) => {
      if (f.selected) {
        selectedFilesCount++;
        totalSelectedSize += f.size;
      } else {
        ignoredCount++;
      }
    });

    return {
      totalFiles,
      selectedFilesCount,
      totalSelectedSize: formatBytes(totalSelectedSize),
      ignoredCount,
    };
  }, [files]);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Get appropriate file icon
  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    const style = "w-4 h-4 shrink-0";
    if (ext === "tsx" || ext === "jsx" || ext === "ts" || ext === "js") {
      return <FileCode2 className={`${style} text-orange-500`} />;
    }
    if (ext === "json") {
      return <FileJson className={`${style} text-amber-500`} />;
    }
    if (ext === "css" || ext === "html") {
      return <FileCode className={`${style} text-blue-500`} />;
    }
    if (ext === "md" || ext === "txt") {
      return <FileText className={`${style} text-stone-500`} />;
    }
    if (path.includes(".gitignore") || path.includes(".env") || ext === "config") {
      return <Settings className={`${style} text-stone-600`} />;
    }
    return <File className={`${style} text-stone-400`} />;
  };

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    return files.filter((f) => f.path.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [files, searchTerm]);

  // Handle individual toggle
  const toggleFile = (index: number) => {
    const updated = [...files];
    const absoluteIndex = files.findIndex((f) => f.path === filteredFiles[index].path);
    if (absoluteIndex !== -1) {
      updated[absoluteIndex].selected = !updated[absoluteIndex].selected;
      onFilesChanged(updated);
    }
  };

  // Global selections
  const selectAll = (select: boolean) => {
    const updated = files.map((f) => ({ ...f, selected: select }));
    onFilesChanged(updated);
  };

  const applyDefaultExclusions = () => {
    const updated = files.map((f) => {
      const pathLower = f.path.toLowerCase();
      const isIgnored =
        pathLower.includes("node_modules/") ||
        pathLower.includes("dist/") ||
        pathLower.includes(".next/") ||
        pathLower.includes(".git/") ||
        pathLower.includes(".ds_store") ||
        pathLower.includes(".env") ||
        pathLower.includes("build/") ||
        pathLower.includes("out/");
      return { ...f, selected: !isIgnored };
    });
    onFilesChanged(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
      {/* Header Banner */}
      <div className="bg-stone-50 border-b border-stone-100 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 border border-orange-200 rounded-xl text-orange-600">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-950 text-sm leading-none">Hearth Code Package:</h4>
            <p className="text-xs text-stone-500 font-mono mt-1 break-all">{zipName}</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 bg-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load Different ZIP
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-stone-100 px-4 py-3 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500">Total Kindling</span>
          <span className="text-sm font-bold text-stone-900 font-mono">{stats.totalFiles} files</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500">To Ignite</span>
          <span className="text-sm font-bold text-orange-600 font-mono">{stats.selectedFilesCount} selected</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500">Total Size</span>
          <span className="text-sm font-bold text-stone-900 font-mono">{stats.totalSelectedSize}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500">Excluded (Ignored)</span>
          <span className="text-sm font-bold text-stone-500 font-mono">{stats.ignoredCount} files</span>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="p-3 border-b border-stone-100 shrink-0 flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={() => selectAll(true)}
            className="text-[11px] text-stone-600 hover:text-stone-950 hover:bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-lg transition"
          >
            Select All
          </button>
          <button
            onClick={() => selectAll(false)}
            className="text-[11px] text-stone-600 hover:text-stone-950 hover:bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-lg transition"
          >
            Deselect All
          </button>
          <button
            onClick={applyDefaultExclusions}
            className="text-[11px] text-orange-700 hover:text-orange-800 hover:bg-orange-50 border border-orange-200/50 bg-orange-50/20 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
            title="Auto-ignore common build artifacts, environment files, and dependencies"
          >
            <Layers className="w-3 h-3" />
            Apply Developer Ignores
          </button>
        </div>
      </div>

      {/* Interactive Files Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 min-h-0 bg-stone-50/30">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <Search className="w-8 h-8 text-stone-300 mb-2" />
            <p className="text-xs font-semibold text-stone-600">No matching files found</p>
            <p className="text-[10px] text-stone-400 mt-1">Try refining your search keyword</p>
          </div>
        ) : (
          filteredFiles.map((file, idx) => {
            const isDefaultIgnored = 
              file.path.includes("node_modules/") ||
              file.path.includes("dist/") ||
              file.path.includes(".env");

            return (
              <div
                key={file.path}
                onClick={() => toggleFile(idx)}
                className={`flex items-center justify-between px-4 py-2.5 text-xs hover:bg-stone-50 cursor-pointer transition select-none ${
                  file.selected ? "bg-orange-50/10" : "opacity-60 bg-stone-100/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="shrink-0">
                    {file.selected ? (
                      <CheckSquare className="w-4 h-4 text-orange-600 fill-orange-50" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  {getFileIcon(file.path)}
                  <span className="font-mono text-[11px] text-stone-800 break-all truncate" title={file.path}>
                    {file.path}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDefaultIgnored && !file.selected && (
                    <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm font-semibold border border-amber-100/50">
                      Auto-ignored
                    </span>
                  )}
                  <span className="text-[10px] text-stone-500 font-mono">
                    {formatBytes(file.size)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-stone-50 px-4 py-3 border-t border-stone-200 shrink-0 text-[10px] text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <span className="flex items-center gap-1.5 justify-center sm:justify-start">
          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
          Files with a checked box will be committed. Unchecked files will be excluded.
        </span>
        <span className="font-mono text-stone-400 shrink-0">JSZip Parser v3.10</span>
      </div>
    </div>
  );
}
