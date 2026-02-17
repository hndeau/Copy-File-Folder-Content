import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as assert from 'assert';

export async function createTempWorkspace(subdir?: string): Promise<vscode.Uri> {
  const workspace = vscode.workspace.workspaceFolders?.[0];
  assert.ok(workspace, 'No workspace folder available for tests');

  const base = path.join(
    workspace.uri.fsPath,
    'tmp',
    subdir ?? Date.now().toString()
  );

  await fs.mkdir(base, { recursive: true });
  return vscode.Uri.file(base);
}

export async function writeFile(
  root: vscode.Uri,
  rel: string,
  content: string
): Promise<vscode.Uri> {
  const full = vscode.Uri.joinPath(root, rel);
  await fs.mkdir(path.dirname(full.fsPath), { recursive: true });
  await fs.writeFile(full.fsPath, content, 'utf8');
  return full;
}

export async function writeBinaryFile(
  root: vscode.Uri,
  rel: string,
  bytes: Uint8Array
): Promise<vscode.Uri> {
  const full = vscode.Uri.joinPath(root, rel);
  await fs.mkdir(path.dirname(full.fsPath), { recursive: true });
  await vscode.workspace.fs.writeFile(full, bytes);
  return full;
}
