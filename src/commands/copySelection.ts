import * as vscode from 'vscode';
import { normalizeUris } from '../services/explorerSelection';
import { buildClipboardTextFromUris } from '../services/fileCollector';
import { writeClipboard } from '../services/clipboard';

function estimateTokensFromChars(chars: number): number {
  return Math.max(1, Math.ceil(chars / 4));
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export function registerCopySelectionCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    'copy-file-content.copySelection',
    async (clickedUriOrUris?: vscode.Uri | vscode.Uri[], selectedUris?: vscode.Uri[]) => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Copy File/Folder Content',
          cancellable: false,
        },
        async () => {
          const uris = normalizeUris(clickedUriOrUris, selectedUris);

          // Explorer resources selected
            if (uris.length > 0) {
            const result = await buildClipboardTextFromUris(uris);
            await writeClipboard(result.text);

            const parts: string[] = [];
            parts.push(`Copied ${formatNumber(result.includedFiles)} file(s)`);
            if (result.skippedFiles) {
                parts.push(`${formatNumber(result.skippedFiles)} skipped`);
            }
            parts.push(`${formatNumber(result.totalChars)} chars`);
            parts.push(`~${formatNumber(result.approxTokens)} tokens`);
            if (result.truncated) {
                parts.push('truncated');
            }

            vscode.window.showInformationMessage(parts.join(' · '));
            return;
            }

          // Otherwise: editor selection or whole doc
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showWarningMessage('No Explorer selection and no active editor.');
            return;
          }

          const selection = editor.selection;
          const text =
            selection && !selection.isEmpty
              ? editor.document.getText(selection)
              : editor.document.getText();

          if (!text) {
            vscode.window.showWarningMessage('Nothing to copy.');
            return;
          }

          await writeClipboard(text);

          const chars = text.length;
          const tokens = estimateTokensFromChars(chars);

          vscode.window.showInformationMessage(
            (selection && !selection.isEmpty ? 'Copied selection' : 'Copied document') +
              ` · ${formatNumber(chars)} chars · ~${formatNumber(tokens)} tokens`
          );
        }
      );
    }
  );
}
