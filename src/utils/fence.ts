import * as vscode from 'vscode';

export function guessFence(uri: vscode.Uri): string {
  const p = (uri.path || uri.fsPath || '').toLowerCase();
  const ext = p.includes('.') ? p.substring(p.lastIndexOf('.') + 1) : '';

  switch (ext) {
    case 'ts': return 'typescript';
    case 'js': return 'javascript';
    case 'jsx': return 'jsx';
    case 'tsx': return 'tsx';
    case 'py': return 'python';
    case 'sh': return 'bash';
    case 'ps1': return 'powershell';
    case 'json': return 'json';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'md': return 'markdown';
    case 'toml': return 'toml';
    case 'xml': return 'xml';
    case 'html': return 'html';
    case 'css': return 'css';
    default: return '';
  }
}
