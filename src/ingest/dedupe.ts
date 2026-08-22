import type { Invoice } from "../types.js";

export interface DedupeResult<T> {
  unicas: T[];
  duplicadas: T[];
}

/**
 * Detecta reenvios de la misma factura (mismo numeroFactura + mismo total) para
 * no contarla dos veces en la conciliacion. Facturas sin numeroFactura nunca
 * se consideran duplicadas entre si (no hay forma confiable de saberlo).
 */
export function dedupeByInvoiceNumber<T extends { invoice: Invoice }>(items: T[]): DedupeResult<T> {
  const vistos = new Set<string>();
  const unicas: T[] = [];
  const duplicadas: T[] = [];

  for (const item of items) {
    const { numeroFactura, total } = item.invoice;
    if (!numeroFactura) {
      unicas.push(item);
      continue;
    }
    const key = `${numeroFactura}::${total}`;
    if (vistos.has(key)) {
      duplicadas.push(item);
    } else {
      vistos.add(key);
      unicas.push(item);
    }
  }

  return { unicas, duplicadas };
}
