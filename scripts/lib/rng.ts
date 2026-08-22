/** PRNG determinista (mulberry32) para que el dataset sea reproducible entre corridas. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    float: () => next(),
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    bool: (pTrue = 0.5) => next() < pTrue,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    weighted: <T>(items: readonly [T, number][]): T => {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [item, w] of items) {
        if (r < w) return item;
        r -= w;
      }
      return items[items.length - 1][0];
    },
  };
}

export type Rng = ReturnType<typeof makeRng>;
