import * as vscode from 'vscode';

export type CopyConfig = {
  maxFileBytes: number;
  maxTotalChars: number;
  ignoredDirs: Set<string>;
};

const DEFAULT_MAX_FILE_BYTES = 512 * 1024; // 512 KB
const DEFAULT_MAX_TOTAL_CHARS = 2_000_000; // ~2M chars

const DEFAULT_IGNORED_DIRS = new Set([
  '.git', '.svn', '.hg',
  'node_modules', 'dist', 'out', 'build',
  '.venv', 'venv', '__pycache__',
  '.idea', '.vscode',
]);

export function getCopyConfig(): CopyConfig {
  const cfg = vscode.workspace.getConfiguration('copy-file-content');

  const maxFileBytes = getPositiveNumber(cfg.get<number>('maxFileBytes'), DEFAULT_MAX_FILE_BYTES);
  const maxTotalChars = getPositiveNumber(cfg.get<number>('maxTotalChars'), DEFAULT_MAX_TOTAL_CHARS);

  // Keep ignoredDirs hardcoded for now; can be wired to configuration later.
  const ignoredDirs = new Set(DEFAULT_IGNORED_DIRS);

  return { maxFileBytes, maxTotalChars, ignoredDirs };
}

function getPositiveNumber(v: unknown, fallback: number): number {
  return (typeof v === 'number' && Number.isFinite(v) && v > 0) ? v : fallback;
}
