import * as vscode from 'vscode';

export async function statSafe(uri: vscode.Uri): Promise<vscode.FileStat | null> {
  try {
    return await vscode.workspace.fs.stat(uri);
  } catch {
    return null;
  }
}

export async function readFileSafe(uri: vscode.Uri): Promise<Uint8Array | null> {
  try {
    return await vscode.workspace.fs.readFile(uri);
  } catch {
    return null;
  }
}

export async function readDirSafe(uri: vscode.Uri): Promise<[string, vscode.FileType][] | null> {
  try {
    return await vscode.workspace.fs.readDirectory(uri);
  } catch {
    return null;
  }
}
