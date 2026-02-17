import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { runTests } from '@vscode/test-electron';

function mkdirp(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function main() {
  // When compiled, this file runs from: <root>\out\test
  const realRoot = path.resolve(__dirname, '../..'); // => <root>

  // Create a no-spaces sandbox under %TEMP%
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'cfc-vscode-test-'));
  const junctionRoot = path.join(sandbox, 'ext'); // no spaces

  // Directory junction to your extension root (works without admin in most setups)
  fs.symlinkSync(realRoot, junctionRoot, 'junction');

  const extensionDevelopmentPath = junctionRoot;
  const extensionTestsPath = path.join(junctionRoot, 'out', 'test', 'suite');

  const userDataDir = path.join(sandbox, 'user-data');
  const extensionsDir = path.join(sandbox, 'extensions');
  const workspaceDir = path.join(sandbox, 'workspace');

  mkdirp(userDataDir);
  mkdirp(extensionsDir);
  mkdirp(workspaceDir);

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [
      workspaceDir,
      '--new-window',
      '--disable-extensions',
      '--user-data-dir', userDataDir,
      '--extensions-dir', extensionsDir,
      '--skip-welcome',
      '--skip-release-notes',
      '--disable-workspace-trust',
      '--disable-telemetry',
      '--disable-gpu',
      '--disable-crash-reporter',
      '--disable-updates',
    ],
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
