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

  // NEW: useful for token estimation / UI
  totalChars: number;      // actual output chars (includes join newlines)
  approxTokens: number;    // heuristic
};

const DEFAULT_CONCURRENCY = 8;

// ~4 chars/token is a common rough heuristic for English-ish text.
// Keep it simple + deterministic.
function estimateTokensFromChars(chars: number): number {
  return Math.max(1, Math.ceil(chars / 4));
}

export async function buildClipboardTextFromUris(uris: vscode.Uri[]): Promise<BuildResult> {
  const { maxFileBytes, maxTotalChars } = getCopyConfig();

  const lines: string[] = [];
  let totalChars = 0;

  let includedFiles = 0;
  let skippedFiles = 0;
  let truncated = false;

  const push = (s: string): boolean => {
    // This collector uses lines; count the newline that join() will insert
    const projected = totalChars + s.length + 1;
    if (projected > maxTotalChars) {
      return false;
    }
    lines.push(s);
    totalChars = projected;
    return true;
  };

  const concurrency = Math.max(1, Math.floor(DEFAULT_CONCURRENCY));

  for (const uri of uris) {
    const stat = await statSafe(uri);
    if (!stat) {
      skippedFiles++;
      continue;
    }

    if (stat.type & vscode.FileType.Directory) {
      const files = await collectFilesRecursively(uri);

      // Build blocks in parallel (order-preserving via index).
      const blocks = await mapWithConcurrency(files, concurrency, async (fileUri) => {
        return buildFileBlock(fileUri, maxFileBytes);
      });

      // Efficient totals: sum once (no string joins) after parallel stage.
      // These are *potential* chars if fully appended; actual output may truncate.
      for (const b of blocks) {
        includedFiles += b.included;
        skippedFiles += b.skipped;

        if (b.block.length === 0) {
          continue;
        }

        if (!push(b.block.trimEnd())) {
          truncated = true;
          push('[TRUNCATED: maxTotalChars reached]\n');
          return {
            text: lines.join('\n'),
            includedFiles,
            skippedFiles,
            truncated,
            totalChars,
            approxTokens: estimateTokensFromChars(totalChars),
          };
        }
      }

      push('');
      continue;
    }

    if (stat.type & vscode.FileType.File) {
      const b = await buildFileBlock(uri, maxFileBytes);

      includedFiles += b.included;
      skippedFiles += b.skipped;

      if (b.block.length > 0) {
        if (!push(b.block.trimEnd())) {
          truncated = true;
          push('[TRUNCATED: maxTotalChars reached]\n');
          return {
            text: lines.join('\n'),
            includedFiles,
            skippedFiles,
            truncated,
            totalChars,
            approxTokens: estimateTokensFromChars(totalChars),
          };
        }
      }

      push('');
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
