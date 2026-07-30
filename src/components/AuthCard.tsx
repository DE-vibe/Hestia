import React, { useState, useEffect } from "react";
import { Github, Key, LogOut, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { GithubProfile } from "../types";

interface AuthCardProps {
  onAuthenticated: (token: string, profile: GithubProfile | null) => void;
  token: string;
  profile: GithubProfile | null;
  setToken: (token: string) => void;
  setProfile: (profile: GithubProfile | null) => void;
}

export default function AuthCard({
  onAuthenticated,
  token,
  profile,
  setToken,
  setProfile,
}: AuthCardProps) {
  const [inputToken, setInputToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read from localStorage on mount
    const savedToken = localStorage.getItem("hestia_github_token");
    if (savedToken) {
      setInputToken(savedToken);
      verifyToken(savedToken);
    }
  }, []);

  const verifyToken = async (pat: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/github/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pat }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Authentication failed");
      }

      const userProfile: GithubProfile = await response.json();
      setToken(pat);
      setProfile(userProfile);
      localStorage.setItem("hestia_github_token", pat);
      onAuthenticated(pat, userProfile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid token or network error. Please verify and try again.");
      localStorage.removeItem("hestia_github_token");
      setToken("");
      setProfile(null);
      onAuthenticated("", null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    verifyToken(inputToken.trim());
  };

  const handleDisconnect = () => {
    localStorage.removeItem("hestia_github_token");
    setInputToken("");
    setToken("");
    setProfile(null);
    onAuthenticated("", null);
    setError(null);
  };

  const handleUseSshMode = () => {
    const sshProfile: GithubProfile = {
      login: "ssh-deployment",
      name: "SSH Deployment Key User",
      avatar_url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      html_url: "https://github.com",
    };
    setProfile(sshProfile);
    onAuthenticated("", sshProfile);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 relative overflow-hidden transition-all duration-300">
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

      {profile ? (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.avatar_url}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border-2 border-orange-500 shadow-sm object-cover"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-stone-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 leading-tight">{profile.name}</h3>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-mono bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30">
                  {profile.login === "ssh-deployment" ? "SSH Remote Mode" : "Hearth Connected"}
                </span>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 font-mono">@{profile.login}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <a
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50 dark:bg-stone-800 transition"
            >
              <Github className="w-3.5 h-3.5" />
              View Profile
            </a>
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/40 hover:bg-red-600 dark:hover:bg-red-600 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Connect your GitHub Hearth</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                To securely push code packages, Hestia supports GitHub Personal Access Tokens (PAT) and SSH Deployment Keys for SSH Remote URLs.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="pat" className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                GitHub Personal Access Token (classic or fine-grained)
              </label>
              <div className="relative">
                <input
                  id="pat"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-stone-100 disabled:opacity-50 transition"
                />
                <Github className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,write:repo_hook&description=Hestia%20Code%20Hearth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-350 underline font-medium"
                >
                  Create a PAT on GitHub with "repo" scope →
                </a>
                <button
                  type="button"
                  onClick={handleUseSshMode}
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 underline font-medium text-left cursor-pointer"
                >
                  Or push via SSH Remote URL & Deployment Key
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !inputToken.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 dark:bg-stone-800 hover:bg-stone-850 dark:hover:bg-stone-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:hover:bg-stone-900 dark:disabled:bg-stone-800 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Stoking fire...
                  </>
                ) : (
                  <>
                    Connect PAT
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
