import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Flame, ArrowRight, Code, ChevronRight, Home, Github } from "lucide-react";
import SplashPage from "./components/SplashPage";
import IntroSplash from "./components/IntroSplash";
import GitHubStatusBadge, { GitHubConnectionStatus } from "./components/GitHubStatusBadge";
import { UploadedFile, GithubProfile, PushStatus, AuthMode, WorkspaceDraft } from "./types";

const ACTIVE_DRAFT_KEY = "hestia_workspace_draft";
const SAVED_DRAFTS_KEY = "hestia_saved_drafts";
const DEFAULT_COMMIT_MESSAGE = "feat: bootstrap workspace via Hestia Hearth";

function loadActiveDraft(): Partial<WorkspaceDraft> | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function loadSavedDrafts(): WorkspaceDraft[] {
  try {
    const raw = localStorage.getItem(SAVED_DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const AuthCard = lazy(() => import("./components/AuthCard"));
const HearthUpload = lazy(() => import("./components/HearthUpload"));
const RepoSelector = lazy(() => import("./components/RepoSelector"));
const CommitControls = lazy(() => import("./components/CommitControls"));
const ProgressOverlay = lazy(() => import("./components/ProgressOverlay"));
const RecentCommits = lazy(() => import("./components/RecentCommits"));
const ZipInspector = lazy(() => import("./components/ZipInspector"));
const PricingModal = lazy(() => import("./components/PricingModal"));
const GuidePage = lazy(() => import("./components/GuidePage"));
const NotFoundPage = lazy(() => import("./components/NotFoundPage"));
const DraftsBar = lazy(() => import("./components/DraftsBar"));

const ROUTE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Hestia Code Hearth – Push Code Packages Directly to GitHub",
    description:
      "Push code packages from AI Studio or your device directly to GitHub seamlessly with smart file filtering, SSH deploy keys, and commit generation.",
  },
  "/splash": {
    title: "Welcome | Hestia Code Hearth",
    description:
      "Enter Hestia Code Hearth to bundle and push code packages from AI Studio or your local device directly to GitHub.",
  },
  "/workspace": {
    title: "Workspace | Hestia Code Hearth",
    description:
      "Connect your GitHub PAT or SSH deploy key, inspect ZIP packages, filter dependencies, and push commits directly to GitHub.",
  },
  "/guide": {
    title: "Deployment Guide | Hestia Code Hearth",
    description:
      "Learn how to export a codebase ZIP, authenticate with GitHub, filter dependencies, and publish commits using Hestia Code Hearth.",
  },
};

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
  // Route & Splash View States
  const normalizePath = (p: string) => {
    const clean = p.replace(/\/+$/, "");
    return clean === "" ? "/" : clean;
  };

  const [currentPath, setCurrentPath] = useState<string>(() => normalizePath(window.location.pathname));
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    const initialPath = normalizePath(window.location.pathname);
    return initialPath === "/" || initialPath === "/splash";
  });

  const navigate = (path: string) => {
    const target = normalizePath(path);
    if (target === "/splash") {
      setShowIntro(true);
    }
    if (target !== currentPath) {
      window.history.pushState({}, "", target);
      setCurrentPath(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Sync unique browser page title, meta description, OpenGraph, Twitter, robots, canonical, and JSON-LD per route
  useEffect(() => {
    const isValidRoute = Boolean(ROUTE_META[currentPath]);
    const meta = ROUTE_META[currentPath] || {
      title: "404 – Page Not Found | Hestia Code Hearth",
      description: "The requested page could not be found on Hestia Code Hearth.",
    };
    document.title = meta.title;

    const canonicalUrl = `${window.location.origin}${currentPath}`;
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (isValidRoute) {
      if (!canonicalEl) {
        canonicalEl = document.createElement("link");
        canonicalEl.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute("href", canonicalUrl);
    } else if (canonicalEl) {
      canonicalEl.remove();
    }

    const robotsEl = document.querySelector('meta[name="robots"]');
    if (robotsEl) {
      robotsEl.setAttribute("content", isValidRoute ? "index, follow" : "noindex, follow");
    }

    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute("content", meta.description);

    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute("content", meta.title);

    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute("content", meta.description);

    const twitterTitleEl = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleEl) twitterTitleEl.setAttribute("content", meta.title);

    const twitterDescEl = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescEl) twitterDescEl.setAttribute("content", meta.description);

    const shareImageUrl = `${window.location.origin}/og-image.jpg`;
    const ogImgEl = document.querySelector('meta[property="og:image"]');
    if (ogImgEl) ogImgEl.setAttribute("content", shareImageUrl);
    const twitterImgEl = document.querySelector('meta[name="twitter:image"]');
    if (twitterImgEl) twitterImgEl.setAttribute("content", shareImageUrl);

    const ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (ogUrlEl) {
      ogUrlEl.setAttribute("content", canonicalUrl);
    } else {
      const created = document.createElement("meta");
      created.setAttribute("property", "og:url");
      created.setAttribute("content", canonicalUrl);
      document.head.appendChild(created);
    }

    // Dynamic JSON-LD structured data for current page & breadcrumbs
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${window.location.origin}/`,
      },
    ];
    if (currentPath === "/workspace") {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: "Workspace",
        item: `${window.location.origin}/workspace`,
      });
    } else if (currentPath === "/guide") {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: "Deployment Guide",
        item: `${window.location.origin}/guide`,
      });
    }

    const structuredPayload: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: meta.title,
      description: meta.description,
      url: canonicalUrl,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
    };

    let jsonLdEl = document.getElementById("route-structured-data");
    if (!jsonLdEl) {
      jsonLdEl = document.createElement("script");
      jsonLdEl.id = "route-structured-data";
      jsonLdEl.setAttribute("type", "application/ld+json");
      document.head.appendChild(jsonLdEl);
    }
    jsonLdEl.textContent = JSON.stringify(structuredPayload);
  }, [currentPath]);

  // Premium & Trial states (Unlock everything for 10-day free trial)
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("hestia_premium") === "true";
  });
  const [trialStart] = useState<number>(() => {
    const stored = localStorage.getItem("hestia_trial_start");
    const parsed = stored ? parseInt(stored, 10) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      const now = Date.now();
      localStorage.setItem("hestia_trial_start", now.toString());
      return now;
    }
    return parsed;
  });

  const TRIAL_DURATION_MS = 10 * 24 * 60 * 60 * 1000; // 10 Days
  const elapsedTrial = Date.now() - trialStart;
  const isTrialActive = elapsedTrial < TRIAL_DURATION_MS;
  const trialDaysLeft = isTrialActive
    ? Math.max(1, Math.ceil((TRIAL_DURATION_MS - elapsedTrial) / (24 * 60 * 60 * 1000)))
    : 0;

  // Everything unlocked if in 10-day free trial OR premium
  const isUnlocked = isTrialActive || isPremium;

  const [pushCount, setPushCount] = useState<number>(() => {
    const stored = localStorage.getItem("hestia_push_count");
    const parsed = stored ? parseInt(stored, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Session Authentication State
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<GithubProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<GitHubConnectionStatus>(() =>
    localStorage.getItem("hestia_github_token") ? "checking" : "disconnected"
  );

  // Verify saved GitHub token on app mount so header badge reflects real profile status across routes
  useEffect(() => {
    const savedToken = localStorage.getItem("hestia_github_token");
    if (!savedToken) return;

    let cancelled = false;
    setAuthStatus("checking");
    fetch("/api/github/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: savedToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Authentication failed");
        }
        return res.json();
      })
      .then((userProfile: GithubProfile) => {
        if (cancelled) return;
        setToken(savedToken);
        setProfile(userProfile);
        setOwner((prev) => prev || userProfile.login);
        setAuthStatus("active");
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("hestia_github_token");
        setToken("");
        setProfile(null);
        setAuthStatus("reauth");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load initial active draft from localStorage once on mount
  const [initialDraft] = useState<Partial<WorkspaceDraft> | null>(() => loadActiveDraft());

  // Uploaded Files State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [zipName, setZipName] = useState("");
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Target Repository Configurations (initialized from auto-saved draft)
  const [owner, setOwner] = useState<string>(() => initialDraft?.owner ?? "");
  const [repo, setRepo] = useState<string>(() => initialDraft?.repo ?? "");
  const [branch, setBranch] = useState<string>(() => initialDraft?.branch || "main");
  const [createIfNotExist, setCreateIfNotExist] = useState<boolean>(() => Boolean(initialDraft?.createIfNotExist));
  const [isPrivate, setIsPrivate] = useState<boolean>(() => Boolean(initialDraft?.isPrivate));

  // SSH and Auth Mode (initialized from auto-saved draft)
  const [authMode, setAuthMode] = useState<AuthMode>(() =>
    initialDraft?.authMode === "ssh" ? "ssh" : "token"
  );
  const [sshUrl, setSshUrl] = useState<string>(
    () => initialDraft?.sshUrl ?? (localStorage.getItem("hestia_ssh_url") || "")
  );
  const [deployKey, setDeployKey] = useState<string>(() => localStorage.getItem("hestia_ssh_key") || "");

  // Commit Details (initialized from auto-saved draft)
  const [commitMessage, setCommitMessage] = useState<string>(
    () => initialDraft?.commitMessage ?? DEFAULT_COMMIT_MESSAGE
  );

  // Drafts Management State
  const [savedDrafts, setSavedDrafts] = useState<WorkspaceDraft[]>(() => loadSavedDrafts());
  const [draftLastSavedAt, setDraftLastSavedAt] = useState<number | null>(
    () => initialDraft?.updatedAt ?? null
  );

  // Automatically persist active repository configurations, branch, and commit message to localStorage
  useEffect(() => {
    const now = Date.now();
    const activeDraft: WorkspaceDraft = {
      id: "active",
      name: "Auto-saved Draft",
      owner,
      repo,
      branch,
      createIfNotExist,
      isPrivate,
      authMode,
      sshUrl,
      commitMessage,
      updatedAt: now,
    };
    try {
      localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(activeDraft));
      if (sshUrl) {
        localStorage.setItem("hestia_ssh_url", sshUrl);
      }
      setDraftLastSavedAt(now);
    } catch {
      // Ignore storage quota errors
    }
  }, [owner, repo, branch, createIfNotExist, isPrivate, authMode, sshUrl, commitMessage]);

  const handleSaveNamedDraft = (name: string) => {
    const newDraft: WorkspaceDraft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      owner,
      repo,
      branch,
      createIfNotExist,
      isPrivate,
      authMode,
      sshUrl,
      commitMessage,
      updatedAt: Date.now(),
    };
    setSavedDrafts((prev) => {
      const next = [newDraft, ...prev].slice(0, 20);
      try {
        localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  };

  const handleLoadDraft = (draft: WorkspaceDraft) => {
    setOwner(draft.owner || profile?.login || "");
    setRepo(draft.repo || "");
    setBranch(draft.branch || "main");
    setCreateIfNotExist(Boolean(draft.createIfNotExist));
    setIsPrivate(Boolean(draft.isPrivate));
    setAuthMode(draft.authMode === "ssh" ? "ssh" : "token");
    if (draft.sshUrl !== undefined) {
      setSshUrl(draft.sshUrl);
    }
    setCommitMessage(draft.commitMessage || DEFAULT_COMMIT_MESSAGE);
  };

  const handleDeleteDraft = (id: string) => {
    setSavedDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleResetCurrentDraft = () => {
    const defaultOwner = profile && profile.login !== "ssh-deployment" ? profile.login : "";
    setOwner(defaultOwner);
    setRepo("");
    setBranch("main");
    setCreateIfNotExist(false);
    setIsPrivate(false);
    setAuthMode("token");
    setCommitMessage(DEFAULT_COMMIT_MESSAGE);
    try {
      localStorage.removeItem(ACTIVE_DRAFT_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  // Push Transaction State
  const [pushStatus, setPushStatus] = useState<PushStatus>({
    stage: "idle",
    progress: 0,
  });

  const [commitRefreshTrigger, setCommitRefreshTrigger] = useState(0);
  const pushTimersRef = useRef<number[]>([]);
  const pushRunIdRef = useRef(0);

  const clearPushTimers = () => {
    pushTimersRef.current.forEach((id) => window.clearTimeout(id));
    pushTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearPushTimers();
    };
  }, []);

  const handleAuthenticated = (savedToken: string, userProfile: GithubProfile | null) => {
    setToken(savedToken);
    setProfile(userProfile);
    if (userProfile) {
      if (userProfile.login === "ssh-deployment") {
        setAuthMode("ssh");
      } else {
        setAuthMode("token");
        setOwner((prev) => prev || userProfile.login);
      }
      setAuthStatus("active");
    }
  };

  const handleStatusBadgeClick = () => {
    if (currentPath !== "/workspace") {
      navigate("/workspace");
      return;
    }
    const patInput = document.getElementById("pat");
    if (patInput) {
      patInput.focus();
      patInput.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!isUnlocked && pushCount >= 1) {
      setIsPricingModalOpen(true);
      return;
    }

    const selectedFiles = files.filter((f) => f.selected);
    if (selectedFiles.length === 0) {
      setPushStatus({
        stage: "error",
        progress: 0,
        error: "No files are currently selected for pushing. Please check at least one file box.",
      });
      return;
    }
    if (!branch.trim()) {
      setPushStatus({
        stage: "error",
        progress: 0,
        error: "Please specify a target branch name.",
      });
      return;
    }
    if (authMode === "ssh") {
      if (!sshUrl.trim()) {
        setPushStatus({
          stage: "error",
          progress: 0,
          error: "Please enter a valid SSH Remote URL (e.g. git@github.com:owner/repo.git).",
        });
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
      if (!repo.trim() || !owner.trim()) {
        setPushStatus({
          stage: "error",
          progress: 0,
          error: "Please select or enter a target repository owner and name.",
        });
        return;
      }
    }
    if (!commitMessage.trim()) {
      setPushStatus({
        stage: "error",
        progress: 0,
        error: "Please enter a commit message describing your changes.",
      });
      return;
    }

    // Cancel any stale timers from prior push attempts and advance run guard
    clearPushTimers();
    const runId = ++pushRunIdRef.current;

    // Initialize transactional status
    setPushStatus({
      stage: "preparing",
      progress: 0,
    });

    try {
      const t1 = window.setTimeout(() => {
        if (pushRunIdRef.current !== runId) return;
        setPushStatus((prev) => {
          if (prev.stage === "preparing") {
            return { stage: "blobs", progress: 20, currentFile: selectedFiles[0].path };
          }
          return prev;
        });
      }, 1000);

      const t2 = window.setTimeout(() => {
        if (pushRunIdRef.current !== runId) return;
        setPushStatus((prev) => {
          if (prev.stage === "blobs") {
            return { ...prev, progress: 60, currentFile: selectedFiles[Math.floor(selectedFiles.length / 2)]?.path };
          }
          return prev;
        });
      }, 2500);

      pushTimersRef.current.push(t1, t2);

      // Perform real bulk transmission to Hestia API engine
      const response = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          owner,
          repo,
          branch: branch.trim(),
          commitMessage: commitMessage.trim(),
          files: selectedFiles.map((f) => ({ path: f.path, content: f.content })),
          createIfNotExist,
          isPrivate,
          authMode,
          sshUrl,
          deployKey,
        }),
      });

      const responseData = await response.json();

      if (pushRunIdRef.current !== runId) return;

      if (!response.ok) {
        if (response.status === 401) {
          setAuthStatus("reauth");
        }
        throw new Error(responseData.error || "GitHub Push operation rejected.");
      }

      clearPushTimers();

      // Smoothly advance to completion stages
      setPushStatus({
        stage: "tree",
        progress: 85,
      });

      const t3 = window.setTimeout(() => {
        if (pushRunIdRef.current !== runId) return;
        setPushStatus({
          stage: "commit",
          progress: 95,
        });
      }, 600);

      const t4 = window.setTimeout(() => {
        if (pushRunIdRef.current !== runId) return;
        setPushStatus({
          stage: "ref",
          progress: 100,
        });
      }, 1200);

      const t5 = window.setTimeout(() => {
        if (pushRunIdRef.current !== runId) return;
        setPushStatus({
          stage: "success",
          progress: 100,
          resultUrl: responseData.repositoryUrl,
        });
        setPushCount((prev) => {
          const next = prev + 1;
          localStorage.setItem("hestia_push_count", next.toString());
          return next;
        });
        setCommitRefreshTrigger((prev) => prev + 1);
      }, 1800);

      pushTimersRef.current.push(t3, t4, t5);
    } catch (err: any) {
      clearPushTimers();
      if (pushRunIdRef.current !== runId) return;
      setPushStatus({
        stage: "error",
        progress: 0,
        error: err.message || "An unexpected error occurred during the push process.",
      });
    }
  };

  const handleDismissProgress = () => {
    pushRunIdRef.current += 1;
    clearPushTimers();
    setPushStatus({ stage: "idle", progress: 0 });
  };

  if (showIntro) {
    return (
      <IntroSplash
        onComplete={() => {
          setShowIntro(false);
        }}
      />
    );
  }

  if (currentPath === "/" || currentPath === "/splash") {
    return (
      <SplashPage
        onEnter={() => navigate("/workspace")}
        onNavigate={navigate}
        hasSavedToken={!!localStorage.getItem("hestia_github_token")}
        profile={profile}
        authStatus={authStatus}
      />
    );
  }

  if (currentPath === "/guide") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-stone-50 dark:bg-stone-950" />}>
        <GuidePage onNavigate={navigate} profile={profile} authStatus={authStatus} />
      </Suspense>
    );
  }

  if (currentPath !== "/workspace") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-stone-950" />}>
        <NotFoundPage currentPath={currentPath} onNavigate={navigate} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans flex flex-col antialiased selection:bg-orange-100 dark:selection:bg-orange-950/40 selection:text-orange-900 dark:selection:text-orange-400">
      
      {/* Immersive Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-5 px-6 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Metaphor */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/10">
              <Flame className="w-5.5 h-5.5 text-white fill-white/10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span id="brand-title" className="text-xl font-black text-stone-950 dark:text-stone-50 tracking-tight leading-none uppercase group-hover:text-orange-600 transition-colors">Hestia</span>
                <span className="text-[10px] font-mono text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 font-bold px-2 py-0.5 rounded-md">
                  v1.2.0
                </span>
                {isTrialActive ? (
                  <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs animate-pulse">
                    <span>🎁</span> 10-Day Free Trial ({trialDaysLeft}d left)
                  </span>
                ) : isPremium ? (
                  <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <span>⭐</span> Golden Embers
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
                The Sacred Hearth for code packages. Ignite and push direct to GitHub.
              </p>
            </div>
          </a>

          {/* Internal Navigation & Quick Links */}
          <nav aria-label="Primary Navigation" className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Home
            </a>
            <a
              href="/workspace"
              onClick={(e) => {
                e.preventDefault();
                navigate("/workspace");
              }}
              aria-current="page"
              className="text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/60 px-3 py-2 rounded-xl"
            >
              Workspace
            </a>
            <a
              href="/guide"
              onClick={(e) => {
                e.preventDefault();
                navigate("/guide");
              }}
              className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Guide
            </a>

            <GitHubStatusBadge
              profile={profile}
              status={authStatus}
              onClick={handleStatusBadgeClick}
            />
            
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold transition cursor-pointer"
            >
              <Github className="w-4 h-4" />
              GitHub Portal
            </a>
          </nav>

        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Breadcrumbs & Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-stone-500 dark:text-stone-400">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
                className="inline-flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-900 dark:text-stone-100 font-semibold">Workspace</span>
            </nav>
            <h1 className="text-sm font-bold text-stone-700 dark:text-stone-300 tracking-tight">
              GitHub Package Ignition Workspace
            </h1>
          </div>
          
          {/* STEP 1: Connect Token (Always visible, handles disconnected & connected state gracefully) */}
          <Suspense fallback={<div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center text-xs font-mono text-stone-500">Loading GitHub hearth workspace...</div>}>
            <AuthCard
              onAuthenticated={handleAuthenticated}
              token={token}
              profile={profile}
              setToken={setToken}
              setProfile={setProfile}
              authStatus={authStatus}
              onAuthStatusChange={setAuthStatus}
            />

            <DraftsBar
              owner={owner}
              repo={repo}
              branch={branch}
              createIfNotExist={createIfNotExist}
              isPrivate={isPrivate}
              authMode={authMode}
              commitMessage={commitMessage}
              lastSavedAt={draftLastSavedAt}
              savedDrafts={savedDrafts}
              onSaveNamedDraft={handleSaveNamedDraft}
              onLoadDraft={handleLoadDraft}
              onDeleteDraft={handleDeleteDraft}
              onResetCurrentDraft={handleResetCurrentDraft}
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
                    isTrialActive={isTrialActive}
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
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
                  {/* Daily Hearth Fuel Indicator */}
                  <div className="w-full mb-4 pb-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider text-left">Hearth Fuel Capacity</span>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mt-0.5">
                        {isTrialActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                            <span>🎁</span> 10-Day Free Trial: Unlimited Pushes
                          </span>
                        ) : isPremium ? (
                          "∞ Unlimited Transfers (Golden Premium)"
                        ) : (
                          `${Math.max(0, 1 - pushCount)} / 1 Free Push Left`
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => setIsPricingModalOpen(true)}
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg transition ${
                        isTrialActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                          : isPremium
                          ? "bg-amber-50 text-amber-800 border border-amber-200/50 cursor-default"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs hover:from-amber-600 hover:to-orange-600 cursor-pointer"
                      }`}
                    >
                      {isTrialActive
                        ? `🎁 Trial: ${trialDaysLeft}d Left`
                        : isPremium
                        ? "⭐ Premium Active"
                        : "Upgrade Hearth"}
                    </button>
                  </div>

                  {/* Free Trial Banner */}
                  {isTrialActive && (
                    <div className="w-full mb-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-center gap-1.5">
                        <span>🎉</span> 10-Day Free Trial Active
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed font-medium">
                        Push as much code as you want for the next {trialDaysLeft} day{trialDaysLeft > 1 ? "s" : ""}. Every feature in Hestia is unlocked for you!
                      </p>
                    </div>
                  )}

                  {!isUnlocked && pushCount >= 1 ? (
                    <div className="w-full mb-4 bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-stone-950 flex items-center justify-center gap-1.5">
                        <span>🔒</span> Free Trial Ended & Transfer Limit Reached
                      </p>
                      <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                        Unlock unlimited pushes and custom private repos.
                      </p>
                      <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="mt-3 px-4 py-1.5 bg-stone-950 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-stone-800 transition cursor-pointer"
                      >
                        Activate Golden Hearth ($9.99)
                      </button>
                    </div>
                  ) : null}

                  <button
                    onClick={handleIgniteHearth}
                    disabled={
                      !isUnlocked && pushCount >= 1
                        ? false
                        : files.filter((f) => f.selected).length === 0 ||
                          !branch.trim() ||
                          !commitMessage.trim() ||
                          (authMode === "ssh" ? !sshUrl.trim() : !repo.trim() || !owner.trim()) ||
                          (pushStatus.stage !== "idle" &&
                            pushStatus.stage !== "success" &&
                            pushStatus.stage !== "error")
                    }
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] transition-all duration-300"
                  >
                    <Flame className="w-5.5 h-5.5 fill-white/10" />
                    {!isUnlocked && pushCount >= 1 ? "Upgrade to Ignite & Push" : "Ignite & Push to GitHub"}
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
          </Suspense>

        </div>
      </main>

      {/* Transaction Overlay Portal */}
      {pushStatus.stage !== "idle" && (
        <Suspense fallback={null}>
          <ProgressOverlay
            status={pushStatus}
            totalFiles={files.filter((f) => f.selected).length}
            onDismiss={handleDismissProgress}
          />
        </Suspense>
      )}

      {/* Pricing / Upgrade Modal */}
      {isPricingModalOpen && (
        <Suspense fallback={null}>
          <PricingModal
            isOpen={isPricingModalOpen}
            onClose={() => setIsPricingModalOpen(false)}
            onUpgradeSuccess={() => setIsPremium(true)}
            isTrialActive={isTrialActive}
            trialDaysLeft={trialDaysLeft}
          />
        </Suspense>
      )}

      {/* Standard Humble Footer with Internal Links */}
      <footer className="bg-white dark:bg-stone-900 border-t border-stone-200/80 dark:border-stone-800 py-6 px-6 text-center shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400 font-mono">
          <p className="flex items-center justify-center gap-1.5 flex-wrap">
            <span>Hestia Code Hearth</span>
            <span>&bull;</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/40">Created by DE-vibe</span>
          </p>
          <nav aria-label="Footer Navigation" className="flex items-center gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              className="hover:text-orange-600 dark:hover:text-orange-400 transition"
            >
              Home
            </a>
            <a
              href="/workspace"
              onClick={(e) => {
                e.preventDefault();
                navigate("/workspace");
              }}
              className="hover:text-orange-600 dark:hover:text-orange-400 transition"
            >
              Workspace
            </a>
            <a
              href="/guide"
              onClick={(e) => {
                e.preventDefault();
                navigate("/guide");
              }}
              className="hover:text-orange-600 dark:hover:text-orange-400 transition"
            >
              Guide
            </a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
