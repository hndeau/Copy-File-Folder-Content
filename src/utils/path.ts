import * as vscode from 'vscode';

export function displayPath(uri: vscode.Uri): string {
  try {
    return vscode.workspace.asRelativePath(uri, false);
  } catch {
    return uri.fsPath || uri.path;
  }
}
