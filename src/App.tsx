import React, { useState, useEffect } from "react";
import { Flame, GitPullRequest, Laptop, Shield, Sparkles, FolderUp, HelpCircle, ArrowRight, Github, Code } from "lucide-react";
import AuthCard from "./components/AuthCard";
import HearthUpload from "./components/HearthUpload";
import ZipInspector from "./components/ZipInspector";
import RepoSelector from "./components/RepoSelector";
import CommitControls from "./components/CommitControls";
import ProgressOverlay from "./components/ProgressOverlay";
import SplashPage from "./components/SplashPage";
import IntroSplash from "./components/IntroSplash";
import PricingModal from "./components/PricingModal";
import RecentCommits from "./components/RecentCommits";
import { UploadedFile, GithubProfile, PushStatus, AuthMode } from "./types";

export default function App() {
  // Sync dark/light theme dynamically based on system/device preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const syncTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Initialize on load
    syncTheme(mediaQuery);

    // Dynamic listener for device preference changes
    mediaQuery.addEventListener("change", syncTheme);
    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);
  // Splash View States
  const [showIntro, setShowIntro] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Premium & Limit states
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("hestia_premium") === "true";
  });
  const [pushCount, setPushCount] = useState<number>(() => {
    const stored = localStorage.getItem("hestia_push_count");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Session Authentication State
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<GithubProfile | null>(null);

  // Uploaded Files State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [zipName, setZipName] = useState("");
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Target Repository Configurations
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [createIfNotExist, setCreateIfNotExist] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  // SSH and Auth Mode
  const [authMode, setAuthMode] = useState<AuthMode>("token");
  const [sshUrl, setSshUrl] = useState<string>(() => localStorage.getItem("hestia_ssh_url") || "");
  const [deployKey, setDeployKey] = useState<string>(() => localStorage.getItem("hestia_ssh_key") || "");

  // Commit Details
  const [commitMessage, setCommitMessage] = useState("feat: bootstrap workspace via Hestia Hearth");

  // Push Transaction State
  const [pushStatus, setPushStatus] = useState<PushStatus>({
    stage: "idle",
    progress: 0,
  });

  const [commitRefreshTrigger, setCommitRefreshTrigger] = useState(0);

  const handleAuthenticated = (savedToken: string, userProfile: GithubProfile | null) => {
    setToken(savedToken);
    setProfile(userProfile);
    if (userProfile) {
      setOwner(userProfile.login);
    }
  };

  const handleFilesLoaded = (loadedFiles: UploadedFile[], filename: string) => {
    setFiles(loadedFiles);
    setZipName(filename);
  };

  const handleResetFiles = () => {
    setFiles([]);
    setZipName("");
  };

  // Callback to add/update single files (such as AI-generated README.md)
  const handleAddOrUpdateFile = (path: string, contentBase64: string, size: number) => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.path === path);
      const newFile: UploadedFile = {
        name: path.split("/").pop() || "",
        path,
        content: contentBase64,
        size,
        selected: true,
      };

      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = newFile;
        return updated;
      } else {
        return [...prev, newFile];
      }
    });
  };

  // Perform the bulk git pushing operation
  const handleIgniteHearth = async () => {
    if (!isPremium && pushCount >= 1) {
      setIsPricingModalOpen(true);
      return;
    }

    const selectedFiles = files.filter((f) => f.selected);
    if (selectedFiles.length === 0) {
      alert("No files are currently selected for pushing. Please check at least one file box!");
      return;
    }
    if (authMode === "ssh") {
      if (!sshUrl.trim()) {
        alert("Please enter a valid SSH Remote URL (e.g. git@github.com:owner/repo.git).");
        return;
      }

      // Pre-validation SSH connectivity check via backend proxy
      setPushStatus({ stage: "preparing", progress: 5, currentFile: "Validating SSH remote URL connectivity..." });
      try {
        const checkRes = await fetch("/api/ssh/test-connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sshUrl: sshUrl.trim(),
            deployKey: deployKey.trim(),
          }),
        });
        const checkData = await checkRes.json();
        if (!checkRes.ok || !checkData.success) {
          throw new Error(checkData.error || "SSH connectivity check failed. Verify your SSH Remote URL and Deployment Key.");
        }
      } catch (checkErr: any) {
        setPushStatus({
          stage: "error",
          progress: 0,
          error: `SSH Pre-Validation Failed: ${checkErr.message}`,
        });
        return;
      }
    } else {
      if (!repo.trim()) {
        alert("Please select or enter a target repository name.");
        return;
      }
    }
    if (!commitMessage.trim()) {
      alert("Please enter a commit message describing your changes.");
      return;
    }

    // Initialize transactional status
    setPushStatus({
      stage: "preparing",
      progress: 0,
    });

    try {
      // Simulate incremental progress stages to make the UI feel responsive and active
      setTimeout(() => {
        setPushStatus(prev => {
          if (prev.stage === "preparing") {
            return { stage: "blobs", progress: 20, currentFile: selectedFiles[0].path };
          }
          return prev;
        });
      }, 1000);

      // We'll increment the blob progress as we prepare the payload
      setTimeout(() => {
        setPushStatus(prev => {
          if (prev.stage === "blobs") {
            return { ...prev, progress: 60, currentFile: selectedFiles[Math.floor(selectedFiles.length / 2)]?.path };
          }
          return prev;
        });
      }, 2500);

      // Perform real bulk transmission to Hestia API engine
      const response = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          owner,
          repo,
          branch,
          commitMessage,
          files: selectedFiles.map((f) => ({ path: f.path, content: f.content })),
          createIfNotExist,
          isPrivate,
          authMode,
          sshUrl,
          deployKey,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "GitHub Push operation rejected.");
      }

      // Smoothly advance to completion stages
      setPushStatus({
        stage: "tree",
        progress: 85,
      });

      setTimeout(() => {
        setPushStatus({
          stage: "commit",
          progress: 95,
        });
      }, 800);

      setTimeout(() => {
        setPushStatus({
          stage: "ref",
          progress: 100,
        });
      }, 1500);

      setTimeout(() => {
        setPushStatus({
          stage: "success",
          progress: 100,
          resultUrl: responseData.repositoryUrl,
        });
        setPushCount(prev => {
          const next = prev + 1;
          localStorage.setItem("hestia_push_count", next.toString());
          return next;
        });
        setCommitRefreshTrigger(prev => prev + 1);
      }, 2200);

    } catch (err: any) {
      console.error(err);
      setPushStatus({
        stage: "error",
        progress: 0,
        error: err.message || "An unexpected error occurred during the push process.",
      });
    }
  };

  const handleDismissProgress = () => {
    setPushStatus({ stage: "idle", progress: 0 });
  };

  if (showIntro) {
    return (
      <IntroSplash
        onComplete={() => setShowIntro(false)}
      />
    );
  }

  if (showSplash) {
    return (
      <SplashPage
        onEnter={() => setShowSplash(false)}
        hasSavedToken={!!localStorage.getItem("hestia_github_token")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans flex flex-col antialiased selection:bg-orange-100 dark:selection:bg-orange-950/40 selection:text-orange-900 dark:selection:text-orange-400">
      
      {/* Immersive Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-5 px-6 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Metaphor */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/10">
              <Flame className="w-5.5 h-5.5 text-white fill-white/10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 id="brand-title" className="text-xl font-black text-stone-950 dark:text-stone-50 tracking-tight leading-none uppercase">Hestia</h1>
                <span className="text-[10px] font-mono text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 font-bold px-2 py-0.5 rounded-md">
                  v1.2.0
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
                The Sacred Hearth for code packages. Ignite and push direct to GitHub.
              </p>
            </div>
          </div>

          {/* Quick Context Guides */}
          <div className="flex items-center gap-5">
            <div className="hidden lg:flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium font-mono">
              <Laptop className="w-4 h-4 text-stone-400" />
              <span>Workspace Port: 3000</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium font-mono">
              <Shield className="w-4 h-4 text-stone-400" />
              <span>HTTPS Sandbox Ingress</span>
            </div>
            
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-600 dark:text-stone-350 hover:text-stone-900 dark:hover:text-white bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold transition cursor-pointer"
            >
              <Github className="w-4 h-4" />
              GitHub Portal
            </a>
          </div>

        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          
          {/* STEP 1: Connect Token (Always visible, handles disconnected & connected state gracefully) */}
          <AuthCard
            onAuthenticated={handleAuthenticated}
            token={token}
            profile={profile}
            setToken={setToken}
            setProfile={setProfile}
          />

          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT DASHBOARD PANEL: Code uploaded zip and interactive tree */}
              <div className="lg:col-span-7 space-y-6">
                {files.length === 0 ? (
                  <HearthUpload
                    onFilesLoaded={handleFilesLoaded}
                    isLoading={isLoadingFiles}
                    setIsLoading={setIsLoadingFiles}
                  />
                ) : (
                  <ZipInspector
                    files={files}
                    onFilesChanged={setFiles}
                    zipName={zipName}
                    onReset={handleResetFiles}
                  />
                )}
              </div>

              {/* RIGHT DASHBOARD PANEL: Repository targeting, Commit customizer and Ignite button */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Repository config */}
                <RepoSelector
                  token={token}
                  profile={profile!}
                  owner={owner}
                  setOwner={setOwner}
                  repo={repo}
                  setRepo={setRepo}
                  branch={branch}
                  setBranch={setBranch}
                  createIfNotExist={createIfNotExist}
                  setCreateIfNotExist={setCreateIfNotExist}
                  isPrivate={isPrivate}
                  setIsPrivate={setIsPrivate}
                  authMode={authMode}
                  setAuthMode={setAuthMode}
                  sshUrl={sshUrl}
                  setSshUrl={setSshUrl}
                  deployKey={deployKey}
                  setDeployKey={setDeployKey}
                />

                {/* Commit customizer */}
                <CommitControls
                  files={files}
                  onAddOrUpdateFile={handleAddOrUpdateFile}
                  commitMessage={commitMessage}
                  setCommitMessage={setCommitMessage}
                  token={token}
                  isPremium={isPremium}
                  onUpgradeClick={() => setIsPricingModalOpen(true)}
                />

                {/* Recent Transmissions History */}
                <RecentCommits
                  token={token}
                  owner={owner}
                  repo={repo}
                  refreshTrigger={commitRefreshTrigger}
                />

                {/* Large visual pushing trigger */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
                  {/* Daily Hearth Fuel Indicator */}
                  <div className="w-full mb-4 pb-4 border-b border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider text-left">Hearth Fuel Capacity</span>
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                        {isPremium ? "∞ Unlimited Transfers" : `${Math.max(0, 1 - pushCount)} / 1 Free Push Left`}
                        {!isPremium && (
                          <span className="bg-stone-100 text-stone-600 text-[9px] font-mono px-1.5 py-0.5 rounded">
                            Reset daily
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => setIsPricingModalOpen(true)}
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg transition ${
                        isPremium
                          ? "bg-amber-50 text-amber-800 border border-amber-200/50 cursor-default"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs hover:from-amber-600 hover:to-orange-600 cursor-pointer"
                      }`}
                    >
                      {isPremium ? "⭐ Premium Active" : "Upgrade Hearth"}
                    </button>
                  </div>

                  {!isPremium && pushCount >= 1 ? (
                    <div className="w-full mb-4 bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-stone-950 flex items-center justify-center gap-1.5">
                        <span>🔒</span> Daily Transfer Limit Exceeded
                      </p>
                      <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                        Unlock unlimited pushes and custom private repos.
                      </p>
                      <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="mt-3 px-4 py-1.5 bg-stone-950 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-stone-850 transition cursor-pointer"
                      >
                        Activate Golden Hearth ($9.99)
                      </button>
                    </div>
                  ) : null}

                  <button
                    onClick={handleIgniteHearth}
                    disabled={(!isPremium && pushCount >= 1) ? false : (files.length === 0 || !repo.trim() || !commitMessage.trim())}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] transition-all duration-300"
                  >
                    <Flame className="w-5.5 h-5.5 fill-white/10" />
                    {!isPremium && pushCount >= 1 ? "Upgrade to Ignite & Push" : "Ignite & Push to GitHub"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  
                  {files.length === 0 ? (
                    <p className="text-[10px] text-stone-400 mt-3 text-center font-mono">
                      Feed kindling (load a ZIP codebase) to activate the ignition button.
                    </p>
                  ) : (
                    <p className="text-[10px] text-stone-500 mt-3 text-center font-mono flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-orange-500" />
                      Ready to transmit {files.filter(f => f.selected).length} files to GitHub.
                    </p>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* Transaction Overlay Portal */}
      <ProgressOverlay
        status={pushStatus}
        totalFiles={files.filter((f) => f.selected).length}
        onDismiss={handleDismissProgress}
      />

      {/* Standard Humble Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-6 text-center shrink-0">
        <p className="text-[11px] text-stone-400 font-mono flex items-center justify-center gap-1.5 flex-wrap">
          <span>Hestia Code Hearth</span>
          <span>&bull;</span>
          <span>Dev Container Active</span>
          <span>&bull;</span>
          <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">Created by DE-vibe</span>
        </p>
      </footer>

    </div>
  );
}
