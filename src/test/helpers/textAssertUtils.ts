import * as assert from 'assert';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hasHeaderSuffix(text: string, suffixPathPosix: string): boolean {
  const parts = suffixPathPosix
    .split('/')
    .filter(Boolean)
    .map(escapeRegExp);

  const sep = String.raw`[\\\/]+`;
  const pattern = parts.join(sep);
  const re = new RegExp(String.raw`^##\s+.*${pattern}\s*$`, 'm');
  return re.test(text);
}

export function noHeaderContains(text: string, needle: string): boolean {
  const n = needle.toLowerCase();
  return !text
    .split(/\r?\n/)
    .some(l => l.startsWith('## ') && l.toLowerCase().includes(n));
}

export function countHeaderLines(text: string): number {
  return text.split(/\r?\n/).filter(l => l.startsWith('## ')).length;
}

export function expectTokenHeuristic(totalChars: number, approxTokens: number) {
  const expected = Math.max(1, Math.ceil(totalChars / 4));
  assert.strictEqual(approxTokens, expected);
}
