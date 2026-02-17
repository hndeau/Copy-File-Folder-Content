import * as vscode from 'vscode';
import { getCopyConfig } from './config';
import { collectFilesRecursively } from './fileReader';
import { buildFileBlock } from './formatter';
import { statSafe } from '../utils/fsSafe';
import { mapWithConcurrency } from '../utils/concurrency';

export type BuildResult = {
  text: string;
  includedFiles: number;
  skippedFiles: number;
  truncated: boolean;

  totalChars: number;
  approxTokens: number;
};

const DEFAULT_CONCURRENCY = 8;

function estimateTokensFromChars(chars: number): number {
  return Math.max(1, Math.ceil(chars / 4));
}

export async function buildClipboardTextFromUris(
  uris: vscode.Uri[]
): Promise<BuildResult> {

  const { maxFileBytes, maxTotalChars } = getCopyConfig();

  const lines: string[] = [];
  let totalChars = 0;

  let includedFiles = 0;
  let skippedFiles = 0;
  let truncated = false;

  const seenFiles = new Set<string>();

  const push = (s: string): boolean => {
    const projected = totalChars + s.length + 1;
    if (projected > maxTotalChars) {
      return false;
    }
    lines.push(s);
    totalChars = projected;
    return true;
  };

  const MIN_BLOCK_OVERHEAD = 32;

  const emitFileOnce = async (fileUri: vscode.Uri): Promise<boolean> => {
    const key = fileUri.fsPath || fileUri.toString();
    if (seenFiles.has(key)) {
      return true;
    }

    if (totalChars + MIN_BLOCK_OVERHEAD >= maxTotalChars) {
      truncated = true;
      push('[TRUNCATED: maxTotalChars reached]\n');
      return false;
    }

    seenFiles.add(key);

    const b = await buildFileBlock(fileUri, maxFileBytes);
    includedFiles += b.included;
    skippedFiles += b.skipped;

    if (!b.block) {
      return true;
    }

    if (!push(b.block)) {
      truncated = true;
      push('[TRUNCATED: maxTotalChars reached]\n');
      return false;
    }

    push('');
    return true;
  };


  for (const uri of uris) {
    const stat = await statSafe(uri);
    if (!stat) {
      skippedFiles++;
      continue;
    }

    // FILE
    if (stat.type & vscode.FileType.File) {
      if (!(await emitFileOnce(uri))) {
        break;
      }
      continue;
    }

    // DIRECTORY
    if (stat.type & vscode.FileType.Directory) {
      const files = await collectFilesRecursively(uri);

      for (const fileUri of files) {
        if (!(await emitFileOnce(fileUri))) {
          break;
        }
      }
      continue;
    }

    skippedFiles++;
  }

  return {
    text: lines.join('\n'),
    includedFiles,
    skippedFiles,
    truncated,
    totalChars,
    approxTokens: estimateTokensFromChars(totalChars),
  };
}

