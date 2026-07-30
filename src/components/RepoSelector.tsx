import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Shield,
  Globe,
  Plus,
  List,
  ArrowDown,FolderPlus,
  Loader2,
  AlertCircle,
  Key,
  Terminal,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Lock,
} from "lucide-react";
import { RepoOption, GithubProfile, AuthMode } from "../types";

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
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  sshUrl: string;
  setSshUrl: (url: string) => void;
  deployKey: string;
  setDeployKey: (key: string) => void;
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
  authMode,
  setAuthMode,
  sshUrl,
  setSshUrl,
  deployKey,
  setDeployKey,
}: RepoSelectorProps) {
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"existing" | "create" | "ssh">(
    authMode === "ssh" ? "ssh" : createIfNotExist ? "create" : "existing"
  );
  const [newRepoName, setNewRepoName] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);

  // SSH Key Manager & Connection Validation State
  const [publicKey, setPublicKey] = useState<string>(
    () => localStorage.getItem("hestia_ssh_pubkey") || ""
  );
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  // SSH Connectivity Validation State
  const [testingSsh, setTestingSsh] = useState(false);
  const [sshTestResult, setSshTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const showNotice = (msg: string) => {
    setCopyNotice(msg);
    setTimeout(() => setCopyNotice(null), 3500);
  };

  const handleTestSshConnection = async () => {
    if (!sshUrl.trim()) {
      setSshTestResult({
        success: false,
        message: "Please enter an SSH Remote URL first (e.g., git@github.com:owner/repo.git).",
      });
      return;
    }

    setTestingSsh(true);
    setSshTestResult(null);

    try {
      const res = await fetch("/api/ssh/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sshUrl: sshUrl.trim(),
          deployKey: deployKey.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSshTestResult({
          success: true,
          message: data.message || "Connected successfully to SSH remote!",
          details: data.details,
        });
      } else {
        setSshTestResult({
          success: false,
          message: data.error || "Failed to establish SSH connection.",
        });
      }
    } catch (err: any) {
      setSshTestResult({
        success: false,
        message: err.message || "Failed to communicate with backend SSH validation proxy.",
      });
    } finally {
      setTestingSsh(false);
    }
  };

  useEffect(() => {
    if (token && authMode === "token") {
      fetchRepos();
    }
  }, [token, authMode]);

  // Synchronize tab mode changes with outer state
  const handleTabChange = (mode: "existing" | "create" | "ssh") => {
    setSelectedTab(mode);
    if (mode === "ssh") {
      setAuthMode("ssh");
      setCreateIfNotExist(false);
      if (sshUrl) {
        parseAndSetSshUrl(sshUrl);
      }
    } else if (mode === "create") {
      setAuthMode("token");
      setCreateIfNotExist(true);
      setRepo(newRepoName);
    } else {
      setAuthMode("token");
      setCreateIfNotExist(false);
      if (repos.length > 0) {
        setRepo(repos[0].name);
        setBranch(repos[0].default_branch || "main");
      }
    }
  };

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
      if (profile?.login) {
        setOwner(profile.login);
      }

      // Select first repo as default if not currently selected
      if (repoData.length > 0 && !repo && selectedTab === "existing") {
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

  const parseAndSetSshUrl = (urlStr: string) => {
    setSshUrl(urlStr);
    localStorage.setItem("hestia_ssh_url", urlStr);

    const trimmed = urlStr.trim();
    const regex = /^(?:ssh:\/\/)?git@[\w.-]+(?::\d+)?[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?$/i;
    const match = trimmed.match(regex);
    if (match) {
      const extractedOwner = match[1];
      const extractedRepo = match[2].replace(/\.git$/, "");
      setOwner(extractedOwner);
      setRepo(extractedRepo);
    }
  };

  const handleSshUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parseAndSetSshUrl(e.target.value);
    setSshTestResult(null);
  };

  const handleDeployKeyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDeployKey(val);
    localStorage.setItem("hestia_ssh_key", val);
    setSshTestResult(null);
  };

  // Generate new SSH Key Pair via Server API
  const handleGenerateKeyPair = async () => {
    setGeneratingKey(true);
    setKeyError(null);
    try {
      const res = await fetch("/api/ssh/generate-keypair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: `hestia-${Date.now().toString(36)}@codehearth` }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate keypair");
      }
      const data = await res.json();
      if (!data.privateKey || !data.privateKey.includes("PRIVATE KEY")) {
        throw new Error("Invalid key format returned from generator");
      }

      const formattedPrivKey = data.privateKey.trim() + "\n";
      const formattedPubKey = (data.publicKey || "").trim();

      setDeployKey(formattedPrivKey);
      localStorage.setItem("hestia_ssh_key", formattedPrivKey);

      setPublicKey(formattedPubKey);
      localStorage.setItem("hestia_ssh_pubkey", formattedPubKey);

      showNotice("New SSH key pair generated and saved securely in browser storage!");
    } catch (err: any) {
      console.error("Key generation failed:", err);
      setKeyError(err.message || "Failed to generate SSH keypair");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyPublicKey = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    showNotice("Public Key copied to clipboard!");
  };

  const handleCopyPrivateKey = () => {
    if (!deployKey) return;
    navigator.clipboard.writeText(deployKey);
    showNotice("Private Key copied to clipboard!");
  };

  const handleDownloadPrivateKey = () => {
    if (!deployKey) return;
    const blob = new Blob([deployKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hestia_id_ed25519";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice("Private key downloaded as hestia_id_ed25519");
  };

  const handleClearKey = () => {
    if (window.confirm("Are you sure you want to clear your saved local SSH key pair?")) {
      setDeployKey("");
      setPublicKey("");
      localStorage.removeItem("hestia_ssh_key");
      localStorage.removeItem("hestia_ssh_pubkey");
      showNotice("Local SSH key pair cleared.");
    }
  };

  const handleRepoSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setRepo(selectedName);
    
    // Find default branch
    const foundRepo = repos.find((r) => r.name === selectedName);
    if (foundRepo) {
      setBranch(foundRepo.default_branch || "main");
    }
  };

  const handleNewRepoNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = rawVal.replace(/[^a-zA-Z0-9_\-]/g, "-").toLowerCase();
    setNewRepoName(formatted);
    setRepo(formatted);
  };

  // Check if SSH URL is parsed
  const parsedSsh = sshUrl ? sshUrl.match(/^(?:ssh:\/\/)?git@[\w.-]+(?::\d+)?[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?$/i) : null;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
      
      {/* Mode selection tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-stone-100 dark:border-stone-800/80">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-orange-500" />
          Target Repository
        </h3>

        {/* 3 Mode Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/70 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => handleTabChange("existing")}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === "existing"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <List className="w-3.5 h-3.5 text-stone-500" />
            Existing
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("create")}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === "create"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-orange-500" />
            New Repo
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("ssh")}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === "ssh"
                ? "bg-amber-500 text-white shadow-xs font-bold"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            SSH Remote
          </button>
        </div>
      </div>

      {error && selectedTab !== "ssh" && (
        <div className="mb-4 flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchRepos} className="ml-auto underline font-semibold text-red-800 hover:text-red-950 dark:text-red-400 dark:hover:text-red-300 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {selectedTab === "ssh" ? (
        // ----------------- SSH Remote URL & Deployment Key Mode -----------------
        <div className="space-y-5">
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
            <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
              <span className="font-bold text-amber-800 dark:text-amber-400">
                SSH Remote Deployment Mode:
              </span>{" "}
              Push code directly to any remote git repository via SSH Remote URL and Deployment Keys.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                SSH Remote URL <span className="text-red-500">*</span>
              </label>

              {/* Validation Action Button */}
              <button
                type="button"
                onClick={handleTestSshConnection}
                disabled={testingSsh || !sshUrl.trim()}
                className="text-xs px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Perform quick backend SSH connectivity check"
              >
                {testingSsh ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Test Connectivity</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="git@github.com:owner/repository.git"
                value={sshUrl}
                onChange={handleSshUrlInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 rounded-xl text-sm font-mono text-stone-800 dark:text-stone-100 transition"
              />
              <Terminal className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {parsedSsh ? (
              <p className="text-[11px] text-green-600 dark:text-green-400 mt-1.5 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Parsed: Owner <span className="font-bold">{parsedSsh[1]}</span> / Repo{" "}
                <span className="font-bold">{parsedSsh[2].replace(/\.git$/, "")}</span>
              </p>
            ) : sshUrl ? (
              <p className="text-[11px] text-stone-400 mt-1 font-mono">
                Example format: git@github.com:username/repository.git
              </p>
            ) : null}

            {/* Connection Test Feedback Card */}
            {sshTestResult && (
              <div
                className={`mt-3 p-3.5 rounded-xl border text-xs font-mono flex items-start gap-2.5 transition ${
                  sshTestResult.success
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
                }`}
              >
                {sshTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 leading-relaxed">
                  <div className="font-bold">{sshTestResult.message}</div>
                  {sshTestResult.details && (
                    <div className="text-[10px] text-green-700/80 dark:text-green-400/80 whitespace-pre-wrap pt-1 border-t border-green-200/50 dark:border-green-900/30">
                      {sshTestResult.details}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Target Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value.replace(/\s+/g, ""))}
                placeholder="e.g. main"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 rounded-xl text-sm font-mono text-stone-800 dark:text-stone-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Protocol Authentication
              </label>
              <div className="px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-mono text-stone-600 dark:text-stone-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>SSH Key-Based Protocol</span>
              </div>
            </div>
          </div>

          {/* ---------------- Dedicated SSH Key Management UI Card ---------------- */}
          <div className="mt-6 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 bg-stone-50/50 dark:bg-stone-850/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Local SSH Key Management
                </h4>
              </div>

              {/* Security & Status Badge */}
              <div className="flex items-center gap-2 text-xs">
                {deployKey && deployKey.trim().startsWith("-----BEGIN") ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-medium text-[11px] border border-green-200 dark:border-green-900/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    Key Saved ({deployKey.includes("OPENSSH") ? "Ed25519" : deployKey.includes("RSA") ? "RSA" : "Private Key"})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                    No Key Saved
                  </span>
                )}
              </div>
            </div>

            {/* Notification Notice */}
            {copyNotice && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{copyNotice}</span>
              </div>
            )}

            {keyError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{keyError}</span>
              </div>
            )}

            {/* Generator Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleGenerateKeyPair}
                disabled={generatingKey}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {generatingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating Key Pair...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generate New SSH Key Pair
                  </>
                )}
              </button>

              {deployKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Saved Key
                </button>
              )}
            </div>

            {/* Public Key Display (For GitHub Deploy Keys settings) */}
            {publicKey && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    Public Deploy Key (Add this to GitHub Repository Settings)
                  </label>

                  <button
                    type="button"
                    onClick={handleCopyPublicKey}
                    className="text-xs px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-lg transition flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-500" />
                    Copy Public Key
                  </button>
                </div>

                <div className="p-3 bg-stone-900 text-amber-400 font-mono text-[11px] rounded-xl overflow-x-auto break-all border border-stone-800 leading-relaxed max-h-24 select-all">
                  {publicKey}
                </div>

                {/* 3-Step Setup Instructions */}
                <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-[11px] space-y-1.5 text-stone-600 dark:text-stone-400 leading-relaxed">
                  <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Setup Instructions for GitHub Deploy Key:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Copy the Public Key above.</li>
                    <li>
                      Go to your GitHub repository &rarr; <strong>Settings</strong> &rarr;{" "}
                      <strong>Deploy keys</strong> &rarr; <strong>Add deploy key</strong>.
                      {parsedSsh && (
                        <a
                          href={`https://github.com/${parsedSsh[1]}/${parsedSsh[2].replace(/\.git$/, "")}/settings/keys/new`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 text-amber-600 dark:text-amber-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                        >
                          Open Settings <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </li>
                    <li>
                      Paste the key, check <strong>"Allow write access"</strong>, and save!
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Private Key Input Area */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  SSH Private Deployment Key
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 font-mono cursor-pointer"
                  >
                    {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showKeyText ? "Hide Key" : "Show Key"}
                  </button>

                  {deployKey && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyPrivateKey}
                        className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 font-mono cursor-pointer"
                        title="Copy Private Key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadPrivateKey}
                        className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 font-mono cursor-pointer"
                        title="Download Private Key"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </>
                  )}
                </div>
              </div>

              <textarea
                rows={4}
                value={deployKey}
                onChange={handleDeployKeyInputChange}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 rounded-xl text-xs font-mono text-stone-800 dark:text-stone-100 transition leading-relaxed ${
                  !showKeyText && deployKey ? "filter blur-[3px] select-none" : ""
                }`}
              />
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Key is stored securely in your browser's LocalStorage (`hestia_ssh_key`) and used for git push operations.
              </p>
            </div>
          </div>
        </div>
      ) : selectedTab === "create" ? (
        // ----------------- Create New Repository UI -----------------
        <div className="space-y-4">
          <div className="p-4 bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20 rounded-xl flex items-start gap-3">
            <FolderPlus className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              <span className="font-semibold text-orange-800 dark:text-orange-450">New Repository Mode:</span> Hestia will automatically provision this repository for you on GitHub when you click push.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Repository Owner
              </label>
              <input
                type="text"
                value={owner || profile?.login || ""}
                disabled
                className="w-full px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-mono text-stone-500 dark:text-stone-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Repository Name
              </label>
              <input
                type="text"
                placeholder="e.g. my-awesome-project"
                value={newRepoName}
                onChange={handleNewRepoNameChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 dark:text-stone-100 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Default Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value.replace(/\s+/g, ""))}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 dark:text-stone-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Repository Privacy
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    !isPrivate
                      ? "bg-stone-900 dark:bg-stone-700 border-stone-900 dark:border-stone-700 text-white"
                      : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    isPrivate
                      ? "bg-stone-900 dark:bg-stone-700 border-stone-900 dark:border-stone-700 text-white"
                      : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750"
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
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Select Repository
              </label>
              {loading ? (
                <div className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs flex items-center gap-2 text-stone-500 dark:text-stone-400 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  Loading repositories...
                </div>
              ) : repos.length === 0 ? (
                <div className="w-full px-3.5 py-2.5 border border-dashed border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs text-stone-500 dark:text-stone-400 font-mono">
                  No repositories found. Create one or use SSH!
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={repo}
                    onChange={handleRepoSelectChange}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 dark:text-stone-100 transition appearance-none cursor-pointer"
                  >
                    {repos.map((r) => (
                      <option key={r.full_name} value={r.name} className="dark:bg-stone-900 dark:text-stone-100">
                        {r.name} {r.private ? "🔒" : "🌐"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 dark:text-stone-500">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Target Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value.replace(/\s+/g, ""))}
                placeholder="e.g. main"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-sm font-mono text-stone-800 dark:text-stone-100 transition"
              />
            </div>
          </div>

          {repo && repos.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800/60 font-mono">
              <span className="font-semibold text-stone-700 dark:text-stone-300">Target:</span>
              <span>github.com/{owner}/{repo}</span>
              <span className="text-stone-300 dark:text-stone-700">|</span>
              <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400 font-semibold">
                <GitBranch className="w-3 h-3" />
                {branch}
              </span>
              <span className="ml-auto">
                {repos.find((r) => r.name === repo)?.private ? (
                  <span className="text-[10px] bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded font-bold uppercase shrink-0">Private</span>
                ) : (
                  <span className="text-[10px] bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-200/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">Public</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

