export function looksBinary(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 4096);

  for (let i = 0; i < n; i++) {
    if (bytes[i] === 0) {
      return true;
    }
  }

  return false;
}
