import * as vscode from 'vscode';

export function normalizeUris(
  clickedUriOrUris?: vscode.Uri | vscode.Uri[],
  selectedUris?: vscode.Uri[]
): vscode.Uri[] {

  const rawList: unknown[] =
    Array.isArray(clickedUriOrUris) && clickedUriOrUris.length > 0
      ? clickedUriOrUris
      : selectedUris && selectedUris.length > 0
        ? selectedUris
        : clickedUriOrUris
          ? [clickedUriOrUris]
          : [];

  const seen = new Set<string>();
  const out: vscode.Uri[] = [];

  for (const item of rawList) {
    if (!(item instanceof vscode.Uri)) {
      continue;
    }

    const key = item.toString();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }

  return out;
}