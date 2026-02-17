import * as vscode from 'vscode';
import { statSafe } from '../utils/fsSafe';
import { readFileBytes } from './fileReader';
import { looksBinary } from '../utils/detectBinary';
import { displayPath } from '../utils/path';
import { guessFence } from '../utils/fence';

export type FileBlockResult = {
  block: string;        // formatted markdown block (may be empty)
  blockChars: number;   // block.length (+ newline handled by collector)
  included: number;
  skipped: number;
  truncated: boolean;
};

export async function buildFileBlock(
  uri: vscode.Uri,
  maxFileBytes: number
): Promise<FileBlockResult> {
  const stat = await statSafe(uri);
  if (!stat || !(stat.type & vscode.FileType.File)) {
    return { block: '', blockChars: 0, included: 0, skipped: 1, truncated: false };
  }

  if (stat.size > maxFileBytes) {
    const header = `## ${displayPath(uri)}`;
    const msg = `[SKIPPED: file too large (${stat.size} bytes > ${maxFileBytes} bytes)]`;
    const block = `${header}\n${msg}\n`;
    return { block, blockChars: block.length, included: 0, skipped: 1, truncated: false };
  }

  const bytes = await readFileBytes(uri);
  if (!bytes) {
    return { block: '', blockChars: 0, included: 0, skipped: 1, truncated: false };
  }

  if (looksBinary(bytes)) {
    const header = `## ${displayPath(uri)}`;
    const msg = '[SKIPPED: binary file]';
    const block = `${header}\n${msg}\n`;
    return { block, blockChars: block.length, included: 0, skipped: 1, truncated: false };
  }

  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/\r\n/g, '\n');
  const header = `## ${displayPath(uri)}`;
  const fence = '```' + guessFence(uri);

  const block = `${header}\n${fence}\n${text}\n\`\`\`\n`;
  return { block, blockChars: block.length, included: 1, skipped: 0, truncated: false };
}
