import * as vscode from 'vscode';

export function cloneUri(uri: vscode.Uri): vscode.Uri {
  return vscode.Uri.file(uri.fsPath);
}

export function uriList(...uris: vscode.Uri[]): vscode.Uri[] {
  return uris;
}
