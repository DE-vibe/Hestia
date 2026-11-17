import React from "react";
import { Flame, ArrowRight, Github, Sparkles, FolderUp, Layers, BookOpen } from "lucide-react";
import { GithubProfile } from "../types";
import GitHubStatusBadge, { GitHubConnectionStatus } from "./GitHubStatusBadge";

interface SplashPageProps {
  onEnter: () => void;
  onNavigate?: (path: string) => void;
  hasSavedToken: boolean;
  profile?: GithubProfile | null;
  authStatus?: GitHubConnectionStatus;
}

export default function SplashPage({
  onEnter,
  onNavigate,
  hasSavedToken,
  profile = null,
  authStatus = "disconnected",
}: SplashPageProps) {
  const handleInternalLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (path === "/workspace") {
      onEnter();
    } else if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* Immersive Background Grid and Glowing Core */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Decorative Radial Amber Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-40 right-10 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Amber Sparks Metaphor */}
      <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping [animation-duration:3s]" />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-amber-500 rounded-full animate-ping [animation-duration:4s]" />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-orange-400 rounded-full animate-ping [animation-duration:5s]" />

      {/* Header Info & Internal Links */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <a
          href="/"
          onClick={(e) => handleInternalLink(e, "/")}
          className="flex items-center gap-2 animate-logo-shimmer"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
            <Flame className="w-4.5 h-4.5 text-white fill-white/10" />
          </div>
          <span className="font-bold text-sm tracking-widest text-stone-300 uppercase">HESTIA HEARTH</span>
        </a>

        <nav aria-label="Primary Navigation" className="flex items-center gap-2 sm:gap-3">
          <a
            href="/"
            onClick={(e) => handleInternalLink(e, "/")}
            aria-current="page"
            className="text-xs font-semibold text-orange-400 px-3 py-1.5 rounded-lg bg-stone-900/80 border border-stone-800"
          >
            Home
          </a>
          <a
            href="/workspace"
            onClick={(e) => handleInternalLink(e, "/workspace")}
            className="text-xs font-semibold text-stone-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-900 transition"
          >
            Workspace
          </a>
          <a
            href="/guide"
            onClick={(e) => handleInternalLink(e, "/guide")}
            className="text-xs font-semibold text-stone-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-900 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            Guide
          </a>
          <GitHubStatusBadge
            profile={profile}
            status={authStatus}
            onClick={onEnter}
            variant="dark"
          />

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-400 hover:text-stone-200 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-900/50 hover:bg-stone-900 transition"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub Portal
          </a>
        </nav>
      </header>

      {/* Main Hero Showcase */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 flex flex-col justify-center items-center py-12 text-center">
        
        {/* Glowing Fire Emblem */}
        <a
          href="/workspace"
          onClick={(e) => handleInternalLink(e, "/workspace")}
          aria-label="Enter Hestia Code Hearth Workspace"
          className="relative mb-8 group cursor-pointer block"
        >
          {/* Pulsing Backlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-65 transition-opacity duration-500" />
          
          <div className="relative w-20 h-20 bg-stone-900 border border-stone-800 rounded-3xl flex items-center justify-center shadow-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="w-11 h-11 text-orange-500 fill-orange-400"
            >
              <path
                d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                className="animate-hearth-flicker"
                style={{ transformOrigin: "center bottom" }}
              />
            </svg>
          </div>
          
          {/* Micro spark badge */}
          <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase border border-stone-950 shadow-lg">
            IGNITE
          </span>
        </a>

        {/* Display Typography pair - Unique H1 */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-3xl leading-none">
          STOKE YOUR CODE, <br />
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            IGNITE TO GITHUB
          </span>
        </h1>

        {/* 10-Day Free Trial Callout Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-full text-emerald-300 font-mono text-xs font-semibold shadow-lg shadow-emerald-950/50 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>🎁 10-Day Free Trial Active for Every New User &bull; Push Unlimited Code</span>
        </div>

        <p className="text-sm sm:text-base text-stone-400 max-w-xl mt-4 leading-relaxed font-medium">
          Hestia is the dedicated code hearth designed to push entire workspace packages 
          directly from any AI Studio or local device to GitHub in seconds.
        </p>

        {/* Enter Code Hearth Call To Action (Internal Link) */}
        <div className="mt-10 flex flex-col items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <a
              href="/workspace"
              onClick={(e) => handleInternalLink(e, "/workspace")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transform hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer"
            >
              {hasSavedToken ? "Return to the Code Hearth" : "Gather Around the Hearth"}
              <ArrowRight className="w-5 h-5" />
            </a>

            <a
              href="/guide"
              onClick={(e) => handleInternalLink(e, "/guide")}
              className="w-full sm:w-auto px-6 py-4 bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4 text-orange-400" />
              Read Deployment Guide
            </a>
          </div>

          {hasSavedToken ? (
            <p className="text-[11px] text-orange-500 font-mono font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              Connected GitHub credentials detected in local storage.
            </p>
          ) : (
            <p className="text-[11px] text-stone-500 font-mono">
              Secure client-side sandbox. No servers capture your secrets.
            </p>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-16 text-left">
          
          <div className="p-5 bg-stone-900/40 border border-stone-800/80 rounded-2xl flex flex-col justify-between hover:border-orange-500/30 hover:bg-stone-900/60 transition group">
            <div>
              <div className="p-2.5 bg-orange-950/40 border border-orange-900/30 rounded-xl text-orange-500 w-fit mb-4">
                <FolderUp className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Any AI Studio or Device</h2>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Download your code workspace as a ZIP from Google AI Studio or prepare a local device backup. Drop it into the{" "}
                <a
                  href="/workspace"
                  onClick={(e) => handleInternalLink(e, "/workspace")}
                  className="text-orange-400 hover:underline"
                >
                  Hearth workspace
                </a>{" "}
                to analyze instantly.
              </p>
            </div>
            <span className="text-[10px] text-stone-600 font-mono mt-4 block">DUAL-SOURCE COMPATIBILITY</span>
          </div>

          <div className="p-5 bg-stone-900/40 border border-stone-800/80 rounded-2xl flex flex-col justify-between hover:border-orange-500/30 hover:bg-stone-900/60 transition group">
            <div>
              <div className="p-2.5 bg-orange-950/40 border border-orange-900/30 rounded-xl text-orange-500 w-fit mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Smart Workspace Filter</h2>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Hestia inspects files and automatically ignores bulky dependencies (<code className="bg-stone-950 text-stone-300 px-1 py-0.5 rounded font-mono">node_modules</code>, build artifacts) to guarantee clean, professional code releases.
              </p>
            </div>
            <span className="text-[10px] text-stone-600 font-mono mt-4 block">ZERO DEBRIS IN REPOS</span>
          </div>

          <div className="p-5 bg-stone-900/40 border border-stone-800/80 rounded-2xl flex flex-col justify-between hover:border-orange-500/30 hover:bg-stone-900/60 transition group">
            <div>
              <div className="p-2.5 bg-orange-950/40 border border-orange-900/30 rounded-xl text-orange-500 w-fit mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Direct GitHub Publishing</h2>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Inspect modified files, customize commit details, and publish directly to public or private GitHub repositories seamlessly.{" "}
                <a
                  href="/guide"
                  onClick={(e) => handleInternalLink(e, "/guide")}
                  className="text-orange-400 hover:underline"
                >
                  View setup guide
                </a>
                .
              </p>
            </div>
            <span className="text-[10px] text-stone-600 font-mono mt-4 block">INSTANT PUBLISHING</span>
          </div>

        </div>

      </main>

      {/* Footer Info with Internal Links */}
      <footer className="relative z-10 w-full text-center py-6 px-6 border-t border-stone-900 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500 font-mono">
          <p>HESTIA CODE HEARTH &bull; SECURED CLIENT-SIDE TRANSACTIONS</p>
          <nav aria-label="Footer Navigation" className="flex items-center gap-4">
            <a href="/" onClick={(e) => handleInternalLink(e, "/")} className="hover:text-stone-300 transition">
              Home
            </a>
            <a href="/workspace" onClick={(e) => handleInternalLink(e, "/workspace")} className="hover:text-stone-300 transition">
              Workspace
            </a>
            <a href="/guide" onClick={(e) => handleInternalLink(e, "/guide")} className="hover:text-stone-300 transition">
              Guide
            </a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
