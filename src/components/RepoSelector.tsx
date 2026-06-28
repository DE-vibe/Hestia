import React, { useState, useEffect } from "react";
import { GitBranch, Shield, Globe, Plus, List, ArrowDown, FolderPlus, Loader2, AlertCircle } from "lucide-react";
import { RepoOption, GithubProfile } from "../types";

interface RepoSelectorProps {
  token: string;
  profile: GithubProfile;
  owner: string;
  setOwner: (owner: string) => void;
  repo: string;
  setRepo: (repo: string) => void;
  branch: string;
  setBranch: (branch: string) => void;
  createIfNotExist: boolean;
  setCreateIfNotExist: (create: boolean) => void;
  isPrivate: boolean;
  setIsPrivate: (isPrivate: boolean) => void;
}

export default function RepoSelector({
  token,
  profile,
  owner,
  setOwner,
  repo,
  setRepo,
  branch,
  setBranch,
  createIfNotExist,
  setCreateIfNotExist,
  isPrivate,
  setIsPrivate,
}: RepoSelectorProps) {
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createNewMode, setCreateNewMode] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");

  useEffect(() => {
    if (token) {
      fetchRepos();
    }
  }, [token]);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/github/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Failed to load your repositories from GitHub");
      }

      const repoData: RepoOption[] = await response.json();
      setRepos(repoData);
      
      // Default owner to current user
      setOwner(profile.login);

      // Select first repo as default if not currently selected
      if (repoData.length > 0 && !repo) {
        const firstRepo = repoData[0];
        setRepo(firstRepo.name);
        setBranch(firstRepo.default_branch || "main");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while communicating with GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setRepo(selectedName);
    
    // Find the default branch for this repo
    const foundRepo = repos.find((r) => r.name === selectedName);
    if (foundRepo) {
      setBranch(foundRepo.default_branch || "main");
    }
  };

  const handleToggleMode = () => {
    const nextMode = !createNewMode;
    setCreateNewMode(nextMode);
    setCreateIfNotExist(nextMode);
    
    if (nextMode) {
      setRepo(newRepoName);
    } else {
      if (repos.length > 0) {
        setRepo(repos[0].name);
        setBranch(repos[0].default_branch || "main");
      }
    }
  };

  const handleNewRepoNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Format repo name to be valid (alphanumeric, dashes, underscores)
    const formatted = rawVal.replace(/[^a-zA-Z0-9_\-]/g, "-").toLowerCase();
    setNewRepoName(formatted);
    setRepo(formatted);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100">
        <h3 className="font-semibold text-stone-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-orange-500" />
          Select Target Repository
        </h3>

        <button
          onClick={handleToggleMode}
          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-stone-200 hover:bg-stone-50 transition flex items-center gap-1 text-stone-700"
        >
          {createNewMode ? (
            <>
              <List className="w-3.5 h-3.5" />
              Select Existing Repo
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              Create New Repo
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchRepos} className="ml-auto underline font-semibold text-red-800 hover:text-red-950">
            Retry
          </button>
        </div>
      )}

      {createNewMode ? (
        // ----------------- Create New Repository UI -----------------
        <div className="space-y-4">
          <div className="p-4 bg-orange-50/30 border border-orange-100/50 rounded-xl flex items-start gap-3">
            <FolderPlus className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-stone-600">
              <span className="font-semibold text-orange-800">New Repository Mode:</span> Hestia will automatically provision this repository for you on GitHub when you click the push button. Super easy!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Repository Owner
              </label>
              <input
                type="text"
                value={owner}
                disabled
                className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm font-mono text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Repository Name
              </label>
              <input
                type="text"
                placeholder="e.g. my-awesome-project"
                value={newRepoName}
                onChange={handleNewRepoNameChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Default Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value.replace(/\s+/g, ""))}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Repository Privacy
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition ${
                    !isPrivate
                      ? "bg-stone-900 border-stone-900 text-white"
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition ${
                    isPrivate
                      ? "bg-stone-900 border-stone-900 text-white"
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Private
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ----------------- Select Existing Repository UI -----------------
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Select Repository
              </label>
              {loading ? (
                <div className="w-full px-3.5 py-2.5 border border-stone-200 bg-stone-50 rounded-xl text-xs flex items-center gap-2 text-stone-500 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  Loading repositories...
                </div>
              ) : repos.length === 0 ? (
                <div className="w-full px-3.5 py-2.5 border border-dashed border-stone-200 bg-stone-50 rounded-xl text-xs text-stone-500 font-mono">
                  No repositories found. Create one!
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={repo}
                    onChange={handleRepoSelectChange}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 transition appearance-none cursor-pointer"
                  >
                    {repos.map((r) => (
                      <option key={r.full_name} value={r.name}>
                        {r.name} {r.private ? "🔒" : "🌐"}
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow Accent */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Target Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value.replace(/\s+/g, ""))}
                placeholder="e.g. main"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 transition"
              />
            </div>
          </div>

          {repo && repos.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100 font-mono">
              <span className="font-semibold text-stone-700">Target:</span>
              <span>github.com/{owner}/{repo}</span>
              <span className="text-stone-300">|</span>
              <span className="flex items-center gap-0.5 text-orange-600 font-semibold">
                <GitBranch className="w-3 h-3" />
                {branch}
              </span>
              <span className="ml-auto">
                {repos.find((r) => r.name === repo)?.private ? (
                  <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-bold uppercase shrink-0">Private</span>
                ) : (
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">Public</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
