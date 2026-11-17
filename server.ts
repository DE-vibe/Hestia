import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { spawnSync } from "child_process";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limit to handle bulk file base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper: Parse SSH remote URL to extract owner and repo
function parseSshUrl(sshUrl: string): { owner: string; repo: string } | null {
  if (!sshUrl || typeof sshUrl !== "string") return null;
  const trimmed = sshUrl.trim();
  const regex = /^(?:ssh:\/\/)?git@[\w.-]+(?::\d+)?[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?$/i;
  const match = trimmed.match(regex);
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ""),
    };
  }
  return null;
}

// Helper: Make fetch request to GitHub API
async function fetchGithub(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Hestia-Code-Hearth",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorBody);
    } catch {
      parsedError = { message: errorBody };
    }
    throw {
      status: response.status,
      message: parsedError.message || "GitHub API Error",
      details: parsedError,
    };
  }
  return response.json();
}

// 1. Get user profile
app.post("/api/github/user", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing GitHub Personal Access Token" });
  }

  try {
    const profile = await fetchGithub("https://api.github.com/user", token);
    res.json({
      login: profile.login,
      name: profile.name || profile.login,
      avatar_url: profile.avatar_url,
      html_url: profile.html_url,
    });
  } catch (err: any) {
    console.error("Error fetching GitHub user:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to authenticate with GitHub" });
  }
});

// 2. Fetch user's repositories
app.post("/api/github/repos", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing GitHub Personal Access Token" });
  }

  try {
    // Fetch both owned repos and repos the user has write access to
    const repos = await fetchGithub("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator", token);
    const repoList = repos.map((repo: any) => ({
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      default_branch: repo.default_branch || "main",
    }));
    res.json(repoList);
  } catch (err: any) {
    console.error("Error fetching repositories:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to fetch repositories" });
  }
});

// 2.5. Fetch last 5 commits for a repository
app.post("/api/github/commits", async (req, res) => {
  const { token, owner, repo } = req.body;
  if (!token || !owner || !repo) {
    return res.status(400).json({ error: "Missing required parameters (token, owner, repo)" });
  }

  try {
    const encodedOwner = encodeURIComponent(String(owner).trim());
    const encodedRepo = encodeURIComponent(String(repo).trim());
    const commits = await fetchGithub(`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/commits?per_page=5`, token);
    const commitList = commits.map((item: any) => ({
      sha: item.sha,
      message: item.commit.message,
      author: {
        name: item.commit.author?.name || "Unknown",
        email: item.commit.author?.email || "",
        date: item.commit.author?.date || new Date().toISOString(),
        avatar_url: item.author?.avatar_url || null,
        login: item.author?.login || null,
      },
      html_url: item.html_url,
    }));
    res.json(commitList);
  } catch (err: any) {
    // If repo is empty or doesn't have commits yet, handle gracefully (GitHub API returns 409 or 404)
    if (err.status === 409 || err.status === 404) {
      return res.json([]);
    }
    console.error("Error fetching commits:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to fetch commits" });
  }
});

// 3. Create a new repository
app.post("/api/github/create-repo", async (req, res) => {
  const { token, name, isPrivate, description } = req.body;
  if (!token || !name) {
    return res.status(400).json({ error: "Missing required fields (token, name)" });
  }

  try {
    const repo = await fetchGithub("https://api.github.com/user/repos", token, {
      method: "POST",
      body: JSON.stringify({
        name,
        private: isPrivate ?? false,
        description: description || "Repository created using Hestia Code Hearth",
        auto_init: false, // Create empty repo so we can push fresh
      }),
    });
    res.json({
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      default_branch: repo.default_branch || "main",
    });
  } catch (err: any) {
    console.error("Error creating repository:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to create repository" });
  }
});

// 4. Push files to a repository (The Hestia Code Hearth Engine!)
app.post("/api/github/push", async (req, res) => {
  const { token, owner, repo, branch, commitMessage, files, createIfNotExist, isPrivate, authMode, sshUrl, deployKey } = req.body;

  if (!commitMessage || !files || !Array.isArray(files)) {
    return res.status(400).json({ error: "Missing required parameters for pushing" });
  }

  // Handle SSH Remote URL & Deployment Key mode
  if (authMode === "ssh" || (sshUrl && sshUrl.trim().startsWith("git@"))) {
    const targetSshUrl = (sshUrl || "").trim();
    if (!targetSshUrl) {
      return res.status(400).json({ error: "Missing SSH Remote URL for SSH push mode" });
    }

    const parsed = parseSshUrl(targetSshUrl);
    const targetOwner = owner || parsed?.owner || "remote";
    const targetRepo = repo || parsed?.repo || "repository";
    const targetBranch = branch || "main";

    let tempDir: string | null = null;
    let keyPath: string | null = null;

    try {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hestia-ssh-"));

      let gitSshCmd = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null";

      if (deployKey && deployKey.trim()) {
        keyPath = path.join(tempDir, "id_rsa");
        const cleanedKey = deployKey.trim().replace(/\r\n/g, "\n") + "\n";
        fs.writeFileSync(keyPath, cleanedKey, { mode: 0o600 });
        fs.chmodSync(keyPath, 0o600);
        gitSshCmd = `ssh -i "${keyPath}" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;
      }

      const execEnv: NodeJS.ProcessEnv = {
        ...process.env,
        GIT_SSH_COMMAND: gitSshCmd,
      };

      const runGit = (args: string[]) => {
        const result = spawnSync("git", args, {
          cwd: tempDir!,
          env: execEnv,
          timeout: 45000,
        });
        if (result.status !== 0) {
          const stderr = result.stderr ? result.stderr.toString() : "";
          const stdout = result.stdout ? result.stdout.toString() : "";
          throw new Error(stderr || stdout || `Git process failed (${args.join(" ")})`);
        }
        return result.stdout ? result.stdout.toString().trim() : "";
      };

      // 1. Initialize git repo in temp directory
      runGit(["init", "-b", targetBranch]);
      runGit(["config", "user.name", "Hestia Code Hearth"]);
      runGit(["config", "user.email", "hestia@codehearth.local"]);

      // 2. Write all files safely inside tempDir (prevent path traversal and .git overwrite)
      const resolvedTempDir = path.resolve(tempDir);
      let writtenFilesCount = 0;

      for (const file of files) {
        if (!file?.path || file.content === undefined) continue;
        const normalizedRelPath = String(file.path)
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");
        if (!normalizedRelPath || normalizedRelPath === ".git" || normalizedRelPath.startsWith(".git/") || normalizedRelPath.includes("/.git/")) {
          continue;
        }
        const resolvedFilePath = path.resolve(resolvedTempDir, normalizedRelPath);
        if (!resolvedFilePath.startsWith(resolvedTempDir + path.sep)) {
          continue;
        }
        const fileDir = path.dirname(resolvedFilePath);
        fs.mkdirSync(fileDir, { recursive: true });
        const buffer = Buffer.from(file.content, "base64");
        fs.writeFileSync(resolvedFilePath, buffer);
        writtenFilesCount++;
      }

      if (writtenFilesCount === 0) {
        return res.status(400).json({ error: "No valid files remained after path validation." });
      }

      // 3. Add files and commit
      runGit(["add", "-A"]);
      const statusOut = runGit(["status", "--porcelain"]);
      if (!statusOut) {
        return res.status(400).json({ error: "No files were staged to commit." });
      }
      runGit(["commit", "-m", commitMessage]);

      // 4. Add remote URL
      runGit(["remote", "add", "origin", targetSshUrl]);

      // 5. If createIfNotExist and token is supplied, ensure repo exists via API first
      if (createIfNotExist && token && targetRepo) {
        try {
          await fetchGithub("https://api.github.com/user/repos", token, {
            method: "POST",
            body: JSON.stringify({
              name: targetRepo,
              private: isPrivate ?? false,
              description: "Codebase pushed via Hestia Code Hearth (SSH)",
              auto_init: false,
            }),
          });
        } catch {
          // Repo might already exist, ignore
        }
      }

      // 6. Push to SSH remote
      console.log(`Pushing to ${targetSshUrl} on branch ${targetBranch} via SSH...`);
      runGit(["push", "-u", "origin", targetBranch]);

      let commitSha = "latest";
      try {
        commitSha = runGit(["rev-parse", "HEAD"]);
      } catch {
        // ignore
      }

      const hostMatch = targetSshUrl.match(/^(?:ssh:\/\/)?git@([^:\/]+)/i);
      const webHost = hostMatch ? hostMatch[1] : "github.com";

      return res.json({
        success: true,
        repositoryUrl: `https://${webHost}/${encodeURIComponent(targetOwner)}/${encodeURIComponent(targetRepo)}`,
        commitUrl: `https://${webHost}/${encodeURIComponent(targetOwner)}/${encodeURIComponent(targetRepo)}/commit/${encodeURIComponent(commitSha)}`,
        branch: targetBranch,
        sha: commitSha,
      });
    } catch (err: any) {
      console.error("SSH push error:", err);
      return res.status(500).json({
        error: err.message || "Failed to push to repository via SSH deployment key",
        details: err.stack || null,
      });
    } finally {
      if (tempDir && fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupErr) {
          console.error("Temp directory cleanup failed:", cleanupErr);
        }
      }
    }
  }

  // Standard GitHub REST API Token Push Flow
  if (!token || !owner || !repo || !branch) {
    return res.status(400).json({ error: "Missing required parameters for GitHub token push" });
  }

  const cleanOwner = String(owner).trim();
  const cleanRepo = String(repo).trim();
  const cleanBranch = String(branch).trim();
  const encodedOwner = encodeURIComponent(cleanOwner);
  const encodedRepo = encodeURIComponent(cleanRepo);
  const encodeBranchPath = (b: string) => b.split("/").map(encodeURIComponent).join("/");

  try {
    // Step A: Ensure Repository Exists or Create it
    let repoInfo;
    try {
      repoInfo = await fetchGithub(`https://api.github.com/repos/${encodedOwner}/${encodedRepo}`, token);
    } catch (err: any) {
      if (err.status === 404 && createIfNotExist) {
        console.log(`Repository ${cleanOwner}/${cleanRepo} does not exist. Creating...`);
        repoInfo = await fetchGithub("https://api.github.com/user/repos", token, {
          method: "POST",
          body: JSON.stringify({
            name: cleanRepo,
            private: isPrivate ?? false,
            description: "Codebase pushed via Hestia Code Hearth",
            auto_init: false,
          }),
        });
      } else {
        throw err;
      }
    }

    const actualBranch = cleanBranch || repoInfo.default_branch || "main";
    const encodedBranchRef = encodeBranchPath(actualBranch);

    // Step B: Fetch latest commit of the target branch (if any)
    let parentCommitSha: string | null = null;
    let baseTreeSha: string | null = null;
    let isBrandNewBranch = false;

    try {
      const branchInfo = await fetchGithub(
        `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/branches/${encodedBranchRef}`,
        token
      );
      parentCommitSha = branchInfo.commit.sha;
      baseTreeSha = branchInfo.commit.commit.tree.sha;
    } catch (err: any) {
      if (err.status === 404 || err.status === 409) {
        // Branch doesn't exist or repo is completely empty
        console.log(`Branch ${actualBranch} not found or repo is empty. We will build a new tree.`);
        isBrandNewBranch = true;
      } else {
        throw err;
      }
    }

    // Deduplicate and sanitize valid file paths (last entry wins)
    const sanitizedFilesMap = new Map<string, { path: string; content: string }>();
    for (const file of files) {
      if (!file?.path || file.content === undefined) continue;
      const normalizedPath = String(file.path).replace(/\\/g, "/").replace(/^\/+/, "");
      if (!normalizedPath || normalizedPath.includes("..") || normalizedPath === ".git" || normalizedPath.startsWith(".git/")) {
        continue;
      }
      sanitizedFilesMap.set(normalizedPath, {
        path: normalizedPath,
        content: String(file.content),
      });
    }
    const validFiles = Array.from(sanitizedFilesMap.values());
    if (validFiles.length === 0) {
      return res.status(400).json({ error: "No valid files to commit." });
    }

    // Step C: Create blobs on GitHub in bounded batches to prevent rate limiting
    console.log(`Creating blobs for ${validFiles.length} files...`);
    const CONCURRENCY_LIMIT = 6;
    const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

    for (let i = 0; i < validFiles.length; i += CONCURRENCY_LIMIT) {
      const batch = validFiles.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const blobRes = await fetchGithub(
              `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/git/blobs`,
              token,
              {
                method: "POST",
                body: JSON.stringify({
                  content: file.content,
                  encoding: "base64",
                }),
              }
            );
            return {
              path: file.path,
              mode: "100644",
              type: "blob",
              sha: blobRes.sha,
            };
          } catch (err: any) {
            console.error(`Error creating blob for ${file.path}:`, err);
            throw new Error(`Failed to create blob for ${file.path}: ${err.message}`);
          }
        })
      );
      treeItems.push(...batchResults);
    }

    // Step D: Create Git Tree
    console.log(`Creating git tree for ${treeItems.length} elements...`);
    const treeRequestBody: any = {
      tree: treeItems,
    };
    if (baseTreeSha) {
      treeRequestBody.base_tree = baseTreeSha;
    }

    const newTree = await fetchGithub(
      `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/git/trees`,
      token,
      {
        method: "POST",
        body: JSON.stringify(treeRequestBody),
      }
    );

    // Step E: Create Commit
    console.log(`Creating commit: "${commitMessage}"...`);
    const commitRequestBody: any = {
      message: commitMessage,
      tree: newTree.sha,
    };
    if (parentCommitSha) {
      commitRequestBody.parents = [parentCommitSha];
    }

    const newCommit = await fetchGithub(
      `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/git/commits`,
      token,
      {
        method: "POST",
        body: JSON.stringify(commitRequestBody),
      }
    );

    // Step F: Update Branch Reference
    console.log(`Updating ref for branch refs/heads/${actualBranch} to commit ${newCommit.sha}...`);
    if (isBrandNewBranch) {
      await fetchGithub(
        `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/git/refs`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            ref: `refs/heads/${actualBranch}`,
            sha: newCommit.sha,
          }),
        }
      );
    } else {
      await fetchGithub(
        `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/git/refs/heads/${encodedBranchRef}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            sha: newCommit.sha,
            force: true,
          }),
        }
      );
    }

    res.json({
      success: true,
      repositoryUrl: `https://github.com/${encodedOwner}/${encodedRepo}`,
      commitUrl: `https://github.com/${encodedOwner}/${encodedRepo}/commit/${encodeURIComponent(newCommit.sha)}`,
      branch: actualBranch,
      sha: newCommit.sha,
    });
  } catch (err: any) {
    console.error("Push process failed:", err);
    res.status(err.status || 500).json({
      error: err.message || "Failed to push codebase to GitHub",
      details: err.details || null,
    });
  }
});

// 5. Generate SSH Key Pair for Deploy Keys
app.post("/api/ssh/generate-keypair", (req, res) => {
  const rawComment = typeof req.body?.comment === "string" ? req.body.comment : "hestia-deploy-key";
  const comment = rawComment.replace(/[\r\n]/g, "").slice(0, 128) || "hestia-deploy-key";
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hestia-sshgen-"));
  const keyPath = path.join(tempDir, "id_ed25519");

  try {
    const result = spawnSync("ssh-keygen", ["-t", "ed25519", "-C", comment, "-f", keyPath, "-N", ""], {
      timeout: 10000,
    });

    if (result.status !== 0) {
      throw new Error(result.stderr?.toString() || "Failed executing ssh-keygen");
    }

    const privateKey = fs.readFileSync(keyPath, "utf8");
    const publicKey = fs.readFileSync(`${keyPath}.pub`, "utf8");

    res.json({ privateKey, publicKey, comment });
  } catch (err: any) {
    console.error("ssh-keygen execution failed, falling back to RSA:", err);
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "pkcs1", format: "pem" },
        privateKeyEncoding: { type: "pkcs1", format: "pem" },
      });
      const formattedPub = `ssh-rsa ${Buffer.from(publicKey).toString("base64")} ${comment}`;
      res.json({ privateKey, publicKey: formattedPub, comment });
    } catch {
      res.status(500).json({ error: "Failed to generate SSH keypair" });
    }
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // ignore
      }
    }
  }
});

// 5.5 Test SSH Connection Endpoint
app.post("/api/ssh/test-connection", async (req, res) => {
  const { sshUrl, deployKey } = req.body || {};

  if (!sshUrl || typeof sshUrl !== "string" || !sshUrl.trim()) {
    return res.status(400).json({ success: false, error: "SSH Remote URL is required" });
  }

  const cleanedUrl = sshUrl.trim();

  // Basic format check
  if (!cleanedUrl.startsWith("git@") && !cleanedUrl.startsWith("ssh://")) {
    return res.status(400).json({
      success: false,
      error: "Invalid SSH Remote URL format. Must start with git@ or ssh:// (e.g. git@github.com:owner/repo.git)",
    });
  }

  let tempDir: string | null = null;
  let gitSshCmd = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=8";

  try {
    if (deployKey && typeof deployKey === "string" && deployKey.trim().length > 0) {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hestia-ssh-test-"));
      const keyPath = path.join(tempDir, "id_rsa");
      fs.writeFileSync(keyPath, deployKey.trim() + "\n", { mode: 0o600 });
      gitSshCmd = `ssh -i "${keyPath}" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=8`;
    }

    const execEnv: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_SSH_COMMAND: gitSshCmd,
    };

    const result = spawnSync("git", ["ls-remote", "--heads", cleanedUrl], {
      env: execEnv,
      timeout: 10000,
    });

    if (result.status === 0) {
      const output = result.stdout ? result.stdout.toString().trim() : "";
      const branchCount = output ? output.split("\n").filter(Boolean).length : 0;
      return res.json({
        success: true,
        message: `Connected successfully! (${branchCount} remote branch(es) found)`,
        details: output ? output.split("\n").slice(0, 5).join("\n") : "Empty repository or no heads found",
      });
    } else {
      const stderr = result.stderr ? result.stderr.toString().trim() : "";
      const stdout = result.stdout ? result.stdout.toString().trim() : "";
      const rawError = stderr || stdout || "Connection timed out or host unreachable";

      let userFriendlyError = rawError;
      if (rawError.includes("Permission denied (publickey)")) {
        userFriendlyError = "Permission denied (publickey): The SSH key is invalid or not authorized in GitHub Deploy Keys.";
      } else if (rawError.includes("Could not resolve hostname")) {
        userFriendlyError = "Could not resolve hostname: Check that the SSH URL hostname is valid (e.g. github.com).";
      } else if (rawError.includes("Repository not found")) {
        userFriendlyError = "Repository not found: Please verify that the repository exists on GitHub and your key has access.";
      }

      return res.status(400).json({
        success: false,
        error: userFriendlyError,
        rawError,
      });
    }
  } catch (err: any) {
    console.error("SSH connectivity check exception:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error performing SSH check",
    });
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // ignore
      }
    }
  }
});

// 6. GitHub Copilot & Models Commit Suggestion Endpoint
app.post("/api/copilot/suggest-commit", async (req, res) => {
  const { token, files, style } = req.body || {};

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files provided for commit analysis" });
  }

  // Summarize file structure and snippet previews for prompt context
  const fileSummaries = files
    .slice(0, 15)
    .map((f: { path: string; content?: string }) => {
      let preview = "";
      if (f.content) {
        try {
          const decoded = Buffer.from(f.content, "base64").toString("utf-8");
          preview = decoded.slice(0, 300).replace(/\n/g, " ");
        } catch (e) {
          preview = "[binary or base64 file]";
        }
      }
      return `- File: ${f.path}\n  Preview: ${preview}`;
    })
    .join("\n");

  const prompt = `You are GitHub Copilot assisting a developer in writing a conventional commit message.
Analyze the following staged files (${files.length} total files):
${fileSummaries}

Respond strictly in valid JSON format with three keys:
1. "commitMessage": A single line conventional commit message following standard format (e.g. "feat(auth): integrate SSH keypair generation and local storage UI" or "fix(parser): resolve zip parsing issue"). Max 72 chars.
2. "summary": A concise 2-3 bullet point summary of key changes made.
3. "prDescription": A markdown formatted PR description section summarizing the package changes.

JSON output structure:
{
  "commitMessage": "...",
  "summary": "...",
  "prDescription": "..."
}`;

  let responseData: any = null;
  let source = "";

  // 1. Try GitHub Models / Copilot API if user provided a GitHub token
  if (token && typeof token === "string" && token.trim().length > 0) {
    try {
      const copilotRes = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are GitHub Copilot. You respond strictly in JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (copilotRes.ok) {
        const json = await copilotRes.json();
        const contentStr = json.choices?.[0]?.message?.content;
        if (contentStr) {
          responseData = JSON.parse(contentStr);
          source = "github-copilot-gpt4o";
        }
      } else {
        console.warn("GitHub Models call returned status:", copilotRes.status);
      }
    } catch (err) {
      console.warn("Attempt to call GitHub Models API failed, falling back to Gemini:", err);
    }
  }

  // 2. Fallback to Gemini API if GitHub Copilot API was unavailable or returned error
  if (!responseData && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response.text) {
        responseData = JSON.parse(response.text);
        source = "gemini-2.5-flash";
      }
    } catch (geminiErr) {
      console.error("Gemini fallback also failed:", geminiErr);
    }
  }

  // 3. Fallback deterministic fallback if both APIs fail
  if (!responseData) {
    const mainFile = files[0]?.path || "codebase";
    responseData = {
      commitMessage: `feat(workspace): update ${files.length} package file(s) including ${mainFile}`,
      summary: `• Modified ${files.length} file(s) in workspace\n• Updated primary entry ${mainFile}`,
      prDescription: `## Changes\n- Updated ${files.length} files in Hestia Code Hearth package`,
    };
    source = "hestia-fallback";
  }

  res.json({
    commitMessage: responseData.commitMessage || `feat: update ${files.length} files`,
    summary: responseData.summary || "",
    prDescription: responseData.prDescription || "",
    source,
  });
});

// Dynamic SEO crawl & icon endpoints (absolute host-resolved URLs)
function resolveOrigin(req: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, "");
  }
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = req.get("host") || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

app.get("/sitemap.xml", (req, res) => {
  const origin = resolveOrigin(req);
  const lastmod = new Date().toISOString().split("T")[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/workspace</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/guide</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;
  res.type("application/xml; charset=utf-8").send(xml);
});

app.get("/robots.txt", (req, res) => {
  const origin = resolveOrigin(req);
  res
    .type("text/plain; charset=utf-8")
    .send(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get("/favicon.ico", (_req, res) => {
  const prodIcon = path.join(process.cwd(), "dist", "favicon.svg");
  const devIcon = path.join(process.cwd(), "public", "favicon.svg");
  const iconPath = fs.existsSync(prodIcon) ? prodIcon : devIcon;
  if (fs.existsSync(iconPath)) {
    return res.type("image/svg+xml").sendFile(iconPath);
  }
  res.status(204).end();
});

// Catch unmatched API routes with JSON 404
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Serve frontend assets and bootstrap server
async function bootstrap() {
  const validRoutes = new Set(["/", "/splash", "/workspace", "/guide"]);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const normalized = req.path.replace(/\/+$/, "") || "/";
      const status = validRoutes.has(normalized) ? 200 : 404;
      res.status(status).sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hestia server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap Hestia server:", err);
});
