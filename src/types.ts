/**
 * Shared types for Hestia Code Hearth application.
 */

export interface UploadedFile {
  name: string;
  path: string;      // relative path within the zip/folder, e.g. "src/App.tsx"
  content: string;   // base64 encoded string of file content
  size: number;      // file size in bytes
  selected: boolean; // whether to include this file in the commit
}

export interface CommitSettings {
  owner: string;
  repo: string;
  branch: string;
  commitMessage: string;
  createIfNotExist: boolean;
  isPrivate: boolean;
}

export interface GithubProfile {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

export interface RepoOption {
  name: string;
  full_name: string;
  private: boolean;
  default_branch?: string;
}

export interface PushStatus {
  stage: 'idle' | 'preparing' | 'blobs' | 'tree' | 'commit' | 'ref' | 'success' | 'error';
  progress: number; // percentage from 0 to 100
  currentFile?: string;
  error?: string;
  resultUrl?: string;
}

export interface GithubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatar_url: string | null;
    login: string | null;
  };
  html_url: string;
}

