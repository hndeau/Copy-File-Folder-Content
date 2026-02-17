import * as vscode from 'vscode';
import { registerCopySelectionCommand } from './commands/copySelection';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(registerCopySelectionCommand());
}

export function deactivate() {}
	