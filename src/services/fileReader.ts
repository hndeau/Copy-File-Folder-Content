import * as vscode from 'vscode';
import { getCopyConfig } from './config';
import { readDirSafe, readFileSafe } from '../utils/fsSafe';

export async function collectFilesRecursively(root: vscode.Uri): Promise<vscode.Uri[]> {
  const { ignoredDirs } = getCopyConfig();
  const out: vscode.Uri[] = [];

  async function walk(dir: vscode.Uri): Promise<void> {
    const entries = await readDirSafe(dir);
    if (!entries) {
      return;
    }

    // Preserve filesystem order: do not sort entries.
    for (const [name, type] of entries) {
      if (type & vscode.FileType.Directory) {
        if (ignoredDirs.has(name)) {
          continue;
        }
        await walk(vscode.Uri.joinPath(dir, name));
      } else if (type & vscode.FileType.File) {
        out.push(vscode.Uri.joinPath(dir, name));
      }
    }
  }

  await walk(root);
  return out;
}

export async function readFileBytes(uri: vscode.Uri): Promise<Uint8Array | null> {
  return readFileSafe(uri);
}
