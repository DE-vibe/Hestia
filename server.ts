import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limit to handle bulk file base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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
  const { token, owner, repo, branch, commitMessage, files, createIfNotExist, isPrivate } = req.body;

  if (!token || !owner || !repo || !branch || !commitMessage || !files || !Array.isArray(files)) {
    return res.status(400).json({ error: "Missing required parameters for pushing" });
  }

  try {
    // Step A: Ensure Repository Exists or Create it
    let repoInfo;
    try {
      repoInfo = await fetchGithub(`https://api.github.com/repos/${owner}/${repo}`, token);
    } catch (err: any) {
      if (err.status === 404 && createIfNotExist) {
        console.log(`Repository ${owner}/${repo} does not exist. Creating...`);
        repoInfo = await fetchGithub("https://api.github.com/user/repos", token, {
          method: "POST",
          body: JSON.stringify({
            name: repo,
            private: isPrivate ?? false,
            description: "Codebase pushed via Hestia Code Hearth",
            auto_init: false,
          }),
        });
      } else {
        throw err;
      }
    }

    const actualBranch = branch || repoInfo.default_branch || "main";

    // Step B: Fetch latest commit of the target branch (if any)
    let parentCommitSha: string | null = null;
    let baseTreeSha: string | null = null;
    let isBrandNewBranch = false;

    try {
      const branchInfo = await fetchGithub(`https://api.github.com/repos/${owner}/${repo}/branches/${actualBranch}`, token);
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

    // Step C: Create blobs on GitHub in parallel batches to prevent rate limiting
    console.log(`Creating blobs for ${files.length} files...`);
    const blobPromises = files.map(async (file: any) => {
      try {
        const blobRes = await fetchGithub(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, token, {
          method: "POST",
          body: JSON.stringify({
            content: file.content,
            encoding: "base64",
          }),
        });
        return {
          path: file.path,
          mode: "100644", // standard file mode
          type: "blob",
          sha: blobRes.sha,
        };
      } catch (err: any) {
        console.error(`Error creating blob for ${file.path}:`, err);
        throw new Error(`Failed to create blob for ${file.path}: ${err.message}`);
      }
    });

    const treeItems = await Promise.all(blobPromises);

    // Step D: Create Git Tree
    console.log(`Creating git tree for ${treeItems.length} elements...`);
    const treeRequestBody: any = {
      tree: treeItems,
    };
    if (baseTreeSha) {
      treeRequestBody.base_tree = baseTreeSha;
    }

    const newTree = await fetchGithub(`https://api.github.com/repos/${owner}/${repo}/git/trees`, token, {
      method: "POST",
      body: JSON.stringify(treeRequestBody),
    });

    // Step E: Create Commit
    console.log(`Creating commit: "${commitMessage}"...`);
    const commitRequestBody: any = {
      message: commitMessage,
      tree: newTree.sha,
    };
    if (parentCommitSha) {
      commitRequestBody.parents = [parentCommitSha];
    }

    const newCommit = await fetchGithub(`https://api.github.com/repos/${owner}/${repo}/git/commits`, token, {
      method: "POST",
      body: JSON.stringify(commitRequestBody),
    });

    // Step F: Update Branch Reference
    console.log(`Updating ref for branch refs/heads/${actualBranch} to commit ${newCommit.sha}...`);
    if (isBrandNewBranch) {
      // Create new reference
      await fetchGithub(`https://api.github.com/repos/${owner}/${repo}/git/refs`, token, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${actualBranch}`,
          sha: newCommit.sha,
        }),
      });
    } else {
      // Update existing reference
      await fetchGithub(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${actualBranch}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          sha: newCommit.sha,
          force: true,
        }),
      });
    }

    res.json({
      success: true,
      repositoryUrl: `https://github.com/${owner}/${repo}`,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
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

// 5. Suggest Git Commit Message using Gemini
app.post("/api/gemini/suggest-commit", async (req, res) => {
  const { files, projectSummary } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files provided for analysis" });
  }

  try {
    // Prepare code snapshot for Gemini
    // We pass list of file paths, and if there are key config files, we pass a tiny snippet
    const filesList = files.map((f: any) => `- ${f.path} (${(f.size / 1024).toFixed(1)} KB)`).join("\n");
    
    // Find some small key files (like package.json or config or brief file names) to help Gemini identify the tech stack
    const keyFiles = files.filter((f: any) => 
      f.path.includes("package.json") || 
      f.path.includes("App.tsx") || 
      f.path.includes("index.css") ||
      f.path.includes("metadata.json") ||
      f.path.includes("server.ts")
    ).slice(0, 3);

    let codeSnippets = "";
    for (const k of keyFiles) {
      if (k.content) {
        const decoded = Buffer.from(k.content, 'base64').toString('utf-8').slice(0, 1500);
        codeSnippets += `\n--- File: ${k.path} ---\n${decoded}\n`;
      }
    }

    const prompt = `You are a Senior Release Engineer and Git Version Control Master.
Analyze the following uploaded files and structure, and draft a high-quality, professional, structured Git commit message.

User's brief project description or context: "${projectSummary || 'No extra context provided'}"

Here is the list of files to be committed:
${filesList}

Here are snippets from key files:
${codeSnippets}

Generate a beautifully formatted git commit message. It must include:
1. A concise, descriptive subject line (under 60 characters) using conventional commits (e.g. "feat: add user authentication", "refactor: simplify layout", "init: bootstrap workspace").
2. A brief, bulleted body summarizing the main changes, technology stack identified, and files structured.
Write only the commit message itself. Do not wrap in markdown code blocks like \`\`\`git or \`\`\`. Just return the raw text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const commitMessage = response.text || "feat: upload code package via Hestia Hearth";
    res.json({ commitMessage: commitMessage.trim() });
  } catch (err: any) {
    console.error("Gemini Suggest-Commit failed:", err);
    res.status(500).json({ error: "Failed to generate AI commit message recommendation." });
  }
});

// 6. Generate README using Gemini
app.post("/api/gemini/generate-readme", async (req, res) => {
  const { files, projectName, projectDescription } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ error: "No files provided" });
  }

  try {
    const filesList = files.map((f: any) => `- ${f.path} (${(f.size / 1024).toFixed(1)} KB)`).join("\n");
    
    // Find some small key files
    const keyFiles = files.filter((f: any) => 
      f.path.includes("package.json") || 
      f.path.includes("App.tsx") || 
      f.path.includes("server.ts")
    ).slice(0, 3);

    let codeSnippets = "";
    for (const k of keyFiles) {
      if (k.content) {
        const decoded = Buffer.from(k.content, 'base64').toString('utf-8').slice(0, 1500);
        codeSnippets += `\n--- File: ${k.path} ---\n${decoded}\n`;
      }
    }

    const prompt = `You are a Technical Writer and Developer Experience specialist.
Generate an elegant, professional, highly detailed, and complete README.md for a repository named "${projectName || 'My App'}".

Context provided by the developer: "${projectDescription || 'No description provided'}"

Here is the file structure of the repository:
${filesList}

Here are snippets from some core files to help you understand the tech stack, setup, and features:
${codeSnippets}

Instructions for the README:
- Start with a beautiful header with the project title and a short, inviting description.
- Include sections for: Features, Tech Stack (highlighting identified tech), Project Structure, Getting Started (with precise installation, dev, and build instructions based on package.json if present), and contribution notes.
- Use clean Markdown styling with icons, bullet points, and code blocks.
- Do not write generic placeholders like "add installation here". Write actual command snippets (e.g. 'npm install', 'npm run dev') based on your understanding of the files.
- Return ONLY the raw markdown of the README.md file. No introductory or concluding remarks outside the markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ readme: response.text?.trim() || "# Project" });
  } catch (err: any) {
    console.error("Gemini Generate-README failed:", err);
    res.status(500).json({ error: "Failed to generate AI README recommendation." });
  }
});

// Serve frontend assets and bootstrap server
async function bootstrap() {
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
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hestia server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap Hestia server:", err);
});
