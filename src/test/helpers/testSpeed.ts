import * as assert from 'assert';

export type TestSpeed = 'fast' | 'normal' | 'slow';

type SpeedConfig = {
  expectedMs: number;
  timeoutMs: number;
};

const SPEEDS: Record<TestSpeed, SpeedConfig> = {
  fast:   { expectedMs: 25,  timeoutMs: 50 },
  normal: { expectedMs: 50, timeoutMs: 100 },
  slow:   { expectedMs: 120, timeoutMs: 240 },
};

function register(
  speed: TestSpeed,
  name: string,
  fn: Mocha.AsyncFunc
) {
  test(name, async function () {
    const { expectedMs, timeoutMs } = SPEEDS[speed];

    this.slow(expectedMs);
    this.timeout(timeoutMs);

    const start = process.hrtime.bigint();
    await fn.call(this);
    const end = process.hrtime.bigint();

    const elapsedMs = Number(end - start) / 1_000_000;

    // Enforce performance contract
    assert.ok(
      elapsedMs <= expectedMs,
      `[PERF REGRESSION] "${name}" took ${elapsedMs.toFixed(1)}ms (expected ≤ ${expectedMs}ms)`
    );

    // ✨ Rewrite the test title so Mocha prints timing inline
    this.test!.title = `[${speed.toUpperCase()}] ${name} (${elapsedMs.toFixed(1)}ms)`;
  });
}

export function fastTest(name: string, fn: Mocha.AsyncFunc) {
  register('fast', name, fn);
}

export function normalTest(name: string, fn: Mocha.AsyncFunc) {
  register('normal', name, fn);
}

export function slowTest(name: string, fn: Mocha.AsyncFunc) {
  register('slow', name, fn);
}
