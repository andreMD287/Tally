const FORMAS_JURIDICAS_RE = /\b(S\.?A\.?S\.?|LTDA\.?|S\.?A\.?|S\.?\s*EN\s*C\.?|Y\s*CIA)\b/gi;

export function normalizeName(s: string): string {
  return s
    .toUpperCase()
    .replace(FORMAS_JURIDICAS_RE, "")
    .replace(/[^A-Z0-9]/g, "");
}

function bigrams(s: string): string[] {
  if (s.length < 2) return [s];
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

/** Coeficiente de Sorensen-Dice sobre bigramas, 0..1. Robusto a mayus/minus, puntuacion y forma juridica. */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ba = bigrams(na);
  const bb = bigrams(nb);
  const counts = new Map<string, number>();
  for (const g of ba) counts.set(g, (counts.get(g) ?? 0) + 1);
  let overlap = 0;
  for (const g of bb) {
    const c = counts.get(g) ?? 0;
    if (c > 0) {
      overlap++;
      counts.set(g, c - 1);
    }
  }
  return (2 * overlap) / (ba.length + bb.length);
}
