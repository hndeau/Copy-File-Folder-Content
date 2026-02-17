import * as vscode from 'vscode';
import * as assert from 'assert';

import { buildClipboardTextFromUris } from '../../services/fileCollector';
import { getCopyConfig } from '../../services/config';

import {
  createTempWorkspace,
  writeFile,
  writeBinaryFile,
} from '../helpers/fsTestUtils';

import {
  hasHeaderSuffix,
  noHeaderContains,
  countHeaderLines,
  expectTokenHeuristic,
} from '../helpers/textAssertUtils';

import {
  fastTest,
  normalTest,
  slowTest,
} from '../helpers/testSpeed';

suite('Copy Selection – File & Directory Verification', () => {

  fastTest('1. Single file → includes file content', async () => {
    const root = await createTempWorkspace();
    const file = await writeFile(root, 'a.txt', 'A');

    const r = await buildClipboardTextFromUris([file]);

    assert.strictEqual(r.includedFiles, 1);
    assert.strictEqual(r.skippedFiles, 0);
    assert.ok(r.text.includes('A'));
    assert.ok(hasHeaderSuffix(r.text, 'a.txt'));
    assert.strictEqual(countHeaderLines(r.text), 1);
    expectTokenHeuristic(r.totalChars, r.approxTokens);
  });

  fastTest('2. Empty directory → no content', async () => {
    const root = await createTempWorkspace();
    const dir = vscode.Uri.joinPath(root, 'empty');
    await vscode.workspace.fs.createDirectory(dir);

    const r = await buildClipboardTextFromUris([dir]);

    assert.strictEqual(r.includedFiles, 0);
    assert.strictEqual(r.skippedFiles, 0);
    assert.strictEqual(r.truncated, false);
    assert.strictEqual(r.text.trim(), '');
    assert.strictEqual(countHeaderLines(r.text), 0);
    expectTokenHeuristic(r.totalChars, r.approxTokens);
  });

  normalTest('3. Non-empty directory → includes directory files', async () => {
    const root = await createTempWorkspace();
    await writeFile(root, 'dir/a.txt', 'A');
    await writeFile(root, 'dir/b.txt', 'B');

    const r = await buildClipboardTextFromUris([
      vscode.Uri.joinPath(root, 'dir'),
    ]);

    assert.strictEqual(r.includedFiles, 2);
    assert.strictEqual(r.skippedFiles, 0);
    assert.ok(hasHeaderSuffix(r.text, 'dir/a.txt'));
    assert.ok(hasHeaderSuffix(r.text, 'dir/b.txt'));
    assert.strictEqual(countHeaderLines(r.text), 2);
    expectTokenHeuristic(r.totalChars, r.approxTokens);
  });

  fastTest('4. File + empty directory → file only', async () => {
    const root = await createTempWorkspace();
    const file = await writeFile(root, 'a.txt', 'A');
    const emptyDir = vscode.Uri.joinPath(root, 'empty');
    await vscode.workspace.fs.createDirectory(emptyDir);

    const r = await buildClipboardTextFromUris([file, emptyDir]);

    assert.strictEqual(r.includedFiles, 1);
    assert.ok(noHeaderContains(r.text, 'empty'));
    assert.strictEqual(countHeaderLines(r.text), 1);
  });

  fastTest('5. Two files → includes both files', async () => {
    const root = await createTempWorkspace();
    const a = await writeFile(root, 'a.txt', 'A');
    const b = await writeFile(root, 'b.txt', 'B');

    const r = await buildClipboardTextFromUris([a, b]);

    assert.strictEqual(r.includedFiles, 2);
    assert.strictEqual(countHeaderLines(r.text), 2);
  });

  fastTest('6. Two files + empty directory → files only', async () => {
    const root = await createTempWorkspace();
    const a = await writeFile(root, 'a.txt', 'A');
    const b = await writeFile(root, 'b.txt', 'B');
    const emptyDir = vscode.Uri.joinPath(root, 'empty');
    await vscode.workspace.fs.createDirectory(emptyDir);

    const r = await buildClipboardTextFromUris([a, b, emptyDir]);

    assert.strictEqual(r.includedFiles, 2);
    assert.ok(noHeaderContains(r.text, 'empty'));
  });

  normalTest('7. Two files + non-empty directory → all content', async () => {
    const root = await createTempWorkspace();
    const a = await writeFile(root, 'a.txt', 'A');
    const b = await writeFile(root, 'b.txt', 'B');
    await writeFile(root, 'dir/c.txt', 'C');

    const r = await buildClipboardTextFromUris([
      a,
      b,
      vscode.Uri.joinPath(root, 'dir'),
    ]);

    assert.strictEqual(r.includedFiles, 3);
    assert.strictEqual(countHeaderLines(r.text), 3);
  });

  fastTest('8. Duplicate file selections are de-duplicated (URI-level)', async () => {
    const root = await createTempWorkspace();
    const file = await writeFile(root, 'a.txt', 'A');

    const r = await buildClipboardTextFromUris([file, vscode.Uri.file(file.fsPath)]);

    assert.strictEqual(r.includedFiles, 1);
    assert.strictEqual(countHeaderLines(r.text), 1);
  });

  fastTest('9. Duplicate directory selections are de-duplicated (URI-level)', async () => {
    const root = await createTempWorkspace();
    await writeFile(root, 'dir/a.txt', 'A');
    await writeFile(root, 'dir/b.txt', 'B');

    const dir = vscode.Uri.joinPath(root, 'dir');
    const r = await buildClipboardTextFromUris([dir, vscode.Uri.file(dir.fsPath)]);

    assert.strictEqual(r.includedFiles, 2);
  });

  normalTest('10. Ignored directories (node_modules) are skipped (top-level)', async () => {
    const root = await createTempWorkspace();
    await writeFile(root, 'node_modules/a.txt', 'BAD');
    await writeFile(root, 'src/b.txt', 'GOOD');

    const r = await buildClipboardTextFromUris([root]);

    assert.strictEqual(r.includedFiles, 1);
    assert.ok(hasHeaderSuffix(r.text, 'src/b.txt'));
  });

  normalTest('11. Ignored directories are skipped (nested)', async () => {
    const root = await createTempWorkspace();
    await writeFile(root, 'dir/node_modules/a.txt', 'BAD');
    await writeFile(root, 'dir/ok.txt', 'GOOD');

    const r = await buildClipboardTextFromUris([
      vscode.Uri.joinPath(root, 'dir'),
    ]);

    assert.strictEqual(r.includedFiles, 1);
    assert.ok(hasHeaderSuffix(r.text, 'dir/ok.txt'));
  });

  normalTest('12. Deep recursion → includes nested files', async () => {
    const root = await createTempWorkspace();
    await writeFile(root, 'dir/sub/a.txt', 'A');

    const r = await buildClipboardTextFromUris([
      vscode.Uri.joinPath(root, 'dir'),
    ]);

    assert.strictEqual(r.includedFiles, 1);
    assert.ok(hasHeaderSuffix(r.text, 'dir/sub/a.txt'));
  });

  fastTest('13. Binary files are skipped (and emit a skip block)', async () => {
    const root = await createTempWorkspace();
    await writeBinaryFile(root, 'bin.dat', new Uint8Array([0, 1, 2]));

    const r = await buildClipboardTextFromUris([
      vscode.Uri.joinPath(root, 'bin.dat'),
    ]);

    assert.strictEqual(r.skippedFiles, 1);
    assert.ok(r.text.includes('[SKIPPED: binary file]'));
  });

  fastTest('14. Mixed valid + invalid paths → valid content only', async () => {
    const root = await createTempWorkspace();
    const ok = await writeFile(root, 'a.txt', 'A');
    const missing = vscode.Uri.joinPath(root, 'missing.txt');

    const r = await buildClipboardTextFromUris([ok, missing]);

    assert.strictEqual(r.includedFiles, 1);
    assert.strictEqual(r.skippedFiles, 1);
  });

  fastTest('15. File content is normalized to LF (no CRLF)', async () => {
    const root = await createTempWorkspace();
    const file = await writeFile(root, 'crlf.txt', 'A\r\nB\r\n');

    const r = await buildClipboardTextFromUris([file]);

    assert.ok(!r.text.includes('\r\n'));
  });

  fastTest('16. Code fences include language where known (.ts / .json)', async () => {
    const root = await createTempWorkspace();
    const ts = await writeFile(root, 'a.ts', 'export const x = 1;');
    const json = await writeFile(root, 'b.json', '{"x":1}');

    const r = await buildClipboardTextFromUris([ts, json]);

    assert.ok(r.text.includes('```typescript'));
    assert.ok(r.text.includes('```json'));
  });

  normalTest('17. maxFileBytes enforced (using current defaults)', async () => {
    const { maxFileBytes } = getCopyConfig();
    const root = await createTempWorkspace();
    const big = await writeFile(root, 'big.txt', 'A'.repeat(maxFileBytes + 1));

    const r = await buildClipboardTextFromUris([big]);

    assert.strictEqual(r.includedFiles, 0);
    assert.strictEqual(r.skippedFiles, 1);
  });

  slowTest('18. maxTotalChars enforced (using current defaults)', async function () {
    this.slow(300);
    this.timeout(1000);

    const { maxFileBytes, maxTotalChars } = getCopyConfig();
    const root = await createTempWorkspace();

    const perFile = Math.min(
      maxFileBytes - 1024,
      Math.floor(maxTotalChars / 4) + 50_000
    );

    const uris: vscode.Uri[] = [];
    for (let i = 0; i < 6; i++) {
      uris.push(await writeFile(root, `t${i}.txt`, 'X'.repeat(perFile)));
    }

    const r = await buildClipboardTextFromUris(uris);

    assert.strictEqual(r.truncated, true);
    assert.ok(r.totalChars <= maxTotalChars);
  });

  normalTest('19. Output shape: skip-block headers exist; missing paths do not emit headers', async () => {
    const root = await createTempWorkspace();
    const ok = await writeFile(root, 'ok.txt', 'OK');
    await writeBinaryFile(root, 'bin.dat', new Uint8Array([0]));

    const missing = vscode.Uri.joinPath(root, 'missing.txt');

    const r = await buildClipboardTextFromUris([ok, missing]);

    assert.strictEqual(r.skippedFiles, 1);
  });

  fastTest('20. Selecting a directory containing only ignored content yields empty output', async () => {
    const root = await createTempWorkspace();
    await writeFile(root, 'node_modules/a.txt', 'BAD');

    const r = await buildClipboardTextFromUris([root]);

    assert.strictEqual(r.includedFiles, 0);
  });

  fastTest('21. Directory selection: headers use workspace-relative paths (suffix match)', async () => {
    const root = await createTempWorkspace();
    await writeFile(root, 'dir/sub/a.txt', 'A');

    const r = await buildClipboardTextFromUris([
      vscode.Uri.joinPath(root, 'dir'),
    ]);

    assert.ok(hasHeaderSuffix(r.text, 'dir/sub/a.txt'));
  });

  fastTest('22. Empty selection list → empty output', async () => {
    const r = await buildClipboardTextFromUris([]);

    assert.strictEqual(r.text, '');
    assert.strictEqual(r.includedFiles, 0);
  });

  fastTest('23. Overlapping selections (dir + child file) should not duplicate output (desired)', async () => {
    const root = await createTempWorkspace();
    const file = await writeFile(root, 'dir/a.txt', 'A');

    const r = await buildClipboardTextFromUris([
      vscode.Uri.joinPath(root, 'dir'),
      file,
    ]);

    assert.strictEqual(r.includedFiles, 1);
    assert.strictEqual(countHeaderLines(r.text), 1);
  });
});
