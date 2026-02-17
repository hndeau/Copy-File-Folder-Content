export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const n = items.length;
  const results = new Array<R>(n);

  const limit = Math.max(1, Math.floor(concurrency) || 1);
  let nextIndex = 0;

  async function runner(): Promise<void> {
    while (true) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= n) {
        return;
      }
      results[i] = await worker(items[i], i);
    }
  }

  const runners: Promise<void>[] = [];
  for (let i = 0; i < Math.min(limit, n); i++) {
    runners.push(runner());
  }

  await Promise.all(runners);
  return results;
}
