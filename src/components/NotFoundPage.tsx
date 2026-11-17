import React from "react";
import { Flame, ArrowLeft, FolderUp } from "lucide-react";

interface NotFoundPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function NotFoundPage({ currentPath, onNavigate }: NotFoundPageProps) {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between p-6">
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, "/")}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Flame className="w-4 h-4 text-white fill-white/10" />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase text-stone-200">Hestia Code Hearth</span>
        </a>
        <nav aria-label="Primary Navigation" className="flex items-center gap-4 text-xs font-medium text-stone-400">
          <a href="/" onClick={(e) => handleLinkClick(e, "/")} className="hover:text-white transition">
            Home
          </a>
          <a href="/workspace" onClick={(e) => handleLinkClick(e, "/workspace")} className="hover:text-white transition">
            Workspace
          </a>
          <a href="/guide" onClick={(e) => handleLinkClick(e, "/guide")} className="hover:text-white transition">
            Guide
          </a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-stone-400">
          <a href="/" onClick={(e) => handleLinkClick(e, "/")} className="hover:text-orange-400 transition">
            Home
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-stone-200 font-semibold">404</span>
        </nav>
        <span className="px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-400 font-mono text-xs font-bold">
          404 &bull; PAGE NOT FOUND
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
          Embers Have Cooled Here
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed">
          No route matches <code className="text-orange-300 font-mono bg-stone-900 px-1.5 py-0.5 rounded">{currentPath}</code>. Return to the Hearth home or jump straight into your workspace.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, "/")}
            className="px-5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-xs font-bold inline-flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
          <a
            href="/workspace"
            onClick={(e) => handleLinkClick(e, "/workspace")}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold inline-flex items-center gap-2 transition"
          >
            <FolderUp className="w-4 h-4" />
            Open Workspace
          </a>
        </div>
      </main>

      <footer className="text-center text-[11px] font-mono text-stone-600 py-4">
        Hestia Code Hearth &bull; Custom 404 Route
      </footer>
    </div>
  );
}
