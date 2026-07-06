import React, { useState, useMemo, useEffect } from "react";
import { FolderTree, Search, File, CheckSquare, Square, Check, RefreshCw, Layers, FileCode2, FileJson, FileText, Settings, FileCode } from "lucide-react";
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
  const [ignorePatterns, setIgnorePatterns] = useState(".git, node_modules, dist, .next, .DS_Store, .env, build, out");

  // Helper function to parse ignore pattern string into clean array
  const parsePatterns = (str: string) => {
    return str
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  };

  // Helper to check if file path matches any of the ignore patterns
  const matchesAnyPattern = (path: string, patterns: string[]) => {
    const pathLower = path.toLowerCase();
    return patterns.some((p) => {
      const pLower = p.toLowerCase();
      if (pLower.startsWith("*.")) {
        const ext = pLower.substring(2);
        return pathLower.endsWith("." + ext);
      }
      return pathLower.includes(pLower);
    });
  };

  // Function to apply custom ignores to file selections
  const applyCustomIgnorePatterns = (patternsStr: string = ignorePatterns) => {
    const patterns = parsePatterns(patternsStr);
    const updated = files.map((f) => {
      const isIgnored = matchesAnyPattern(f.path, patterns);
      return { ...f, selected: !isIgnored };
    });
    onFilesChanged(updated);
  };

  // Reset ignore pattern list to developer defaults and apply
  const resetToDefaultIgnores = () => {
    const defaults = ".git, node_modules, dist, .next, .DS_Store, .env, build, out";
    setIgnorePatterns(defaults);
    const patterns = parsePatterns(defaults);
    const updated = files.map((f) => {
      const isIgnored = matchesAnyPattern(f.path, patterns);
      return { ...f, selected: !isIgnored };
    });
    onFilesChanged(updated);
  };

  // Handle live editing of ignore patterns
  const handleIgnorePatternsChange = (newVal: string) => {
    setIgnorePatterns(newVal);
    const patterns = parsePatterns(newVal);
    const updated = files.map((f) => {
      const isIgnored = matchesAnyPattern(f.path, patterns);
      return { ...f, selected: !isIgnored };
    });
    onFilesChanged(updated);
  };

  // Auto-apply custom ignore patterns exactly once when a new ZIP package is loaded
  useEffect(() => {
    if (files.length > 0) {
      const patterns = parsePatterns(ignorePatterns);
      const updated = files.map((f) => {
        const isIgnored = matchesAnyPattern(f.path, patterns);
        return { ...f, selected: !isIgnored };
      });
      onFilesChanged(updated);
    }
  }, [zipName]);

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
      return <Settings className={`${style} text-stone-600 dark:text-stone-400`} />;
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

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col h-[520px]">
      {/* Header Banner */}
      <div className="bg-stone-50 dark:bg-stone-850 border-b border-stone-100 dark:border-stone-800/80 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-950 dark:text-stone-50 text-sm leading-none">Hearth Code Package:</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-1 break-all">{zipName}</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load Different ZIP
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10 border-b border-stone-100 dark:border-stone-800/80 px-4 py-3 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">Total Kindling</span>
          <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">{stats.totalFiles} files</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">To Ignite</span>
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400 font-mono">{stats.selectedFilesCount} selected</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">Total Size</span>
          <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">{stats.totalSelectedSize}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">Excluded (Ignored)</span>
          <span className="text-sm font-bold text-stone-500 dark:text-stone-400 font-mono">{stats.ignoredCount} files</span>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="p-3 border-b border-stone-100 dark:border-stone-800/80 shrink-0 flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-lg text-xs focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:text-stone-100 transition"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={() => selectAll(true)}
            className="text-[11px] text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            Select All
          </button>
          <button
            onClick={() => selectAll(false)}
            className="text-[11px] text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            Deselect All
          </button>
          <button
            onClick={resetToDefaultIgnores}
            className="text-[11px] text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30 bg-orange-50/20 dark:bg-orange-950/10 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
            title="Reset global ignore patterns list to developer defaults"
          >
            <Layers className="w-3 h-3" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Global Ignore Patterns */}
      <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-850 border-b border-stone-100 dark:border-stone-800/80 shrink-0 flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 whitespace-nowrap flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-stone-500" />
            Global Ignore:
          </span>
          <input
            type="text"
            placeholder="e.g. .git, node_modules, *.log"
            value={ignorePatterns}
            onChange={(e) => handleIgnorePatternsChange(e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:text-stone-100 transition"
          />
          <button
            onClick={() => applyCustomIgnorePatterns()}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white dark:text-stone-100 text-[11px] font-semibold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
            title="Excludes matching files from checked selection"
          >
            <Layers className="w-3 h-3" />
            Apply Ignores
          </button>
        </div>
      </div>

      {/* Interactive Files Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60 min-h-0 bg-stone-50/30 dark:bg-stone-950/20">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <Search className="w-8 h-8 text-stone-300 mb-2" />
            <p className="text-xs font-semibold text-stone-600">No matching files found</p>
            <p className="text-[10px] text-stone-400 mt-1">Try refining your search keyword</p>
          </div>
        ) : (
          filteredFiles.map((file, idx) => {
            const parsedPatterns = parsePatterns(ignorePatterns);
            const isMatchedByPatterns = matchesAnyPattern(file.path, parsedPatterns);

            return (
              <div
                key={file.path}
                onClick={() => toggleFile(idx)}
                className={`flex items-center justify-between px-4 py-2.5 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer transition select-none ${
                  file.selected ? "bg-orange-50/10 dark:bg-orange-950/15" : "opacity-60 bg-stone-100/20 dark:bg-stone-900/35"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="shrink-0">
                    {file.selected ? (
                      <CheckSquare className="w-4 h-4 text-orange-600 fill-orange-50 dark:fill-orange-950/30" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400 dark:text-stone-600" />
                    )}
                  </div>
                  {getFileIcon(file.path)}
                  <span className="font-mono text-[11px] text-stone-800 dark:text-stone-200 break-all truncate" title={file.path}>
                    {file.path}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isMatchedByPatterns && !file.selected && (
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25 px-1.5 py-0.5 rounded-sm font-semibold border border-amber-100/50 dark:border-amber-900/20">
                      Ignored
                    </span>
                  )}
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                    {formatBytes(file.size)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-stone-50 dark:bg-stone-850 px-4 py-3 border-t border-stone-200 dark:border-stone-800 shrink-0 text-[10px] text-stone-500 dark:text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <span className="flex items-center gap-1.5 justify-center sm:justify-start">
          <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-450 shrink-0" />
          Files with a checked box will be committed. Unchecked files will be excluded.
        </span>
        <span className="font-mono text-stone-400 dark:text-stone-500 shrink-0">JSZip Parser v3.10</span>
      </div>
    </div>
  );
}
