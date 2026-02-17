import * as vscode from 'vscode';

export async function writeClipboard(text: string): Promise<void> {
  await vscode.env.clipboard.writeText(text);
}
