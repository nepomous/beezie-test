/** Simulates network latency by waiting a random duration within `[minMs, maxMs]`. */
export function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  const durationMs = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
