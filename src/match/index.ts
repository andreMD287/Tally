import type { ExtractoLinea, Invoice, MatchResult } from "../types.js";
import { nameSimilarity } from "./similarity.js";

const FECHA_TOLERANCIA_DIAS = 3;

function daysDiff(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00Z").getTime();
  const b = new Date(isoB + "T00:00:00Z").getTime();
  return Math.round(Math.abs(a - b) / 86_400_000);
}

interface Candidate {
  linea: ExtractoLinea;
  index: number;
  dateDiff: number;
  nameScore: number;
}

/** Busca un par de lineas disponibles, dentro de la ventana de fecha, cuya suma cubra el total exacto. */
function findSplitMatch(
  inv: Invoice,
  disponibles: { linea: ExtractoLinea; index: number }[],
  usadas: Set<number>
): { indices: [number, number]; lineas: [ExtractoLinea, ExtractoLinea]; nameScore: number } | null {
  const enVentana = disponibles
    .filter(({ index }) => !usadas.has(index))
    .map(({ linea, index }) => ({ linea, index, dateDiff: daysDiff(inv.fecha, linea.fecha) }))
    .filter((c) => c.dateDiff <= FECHA_TOLERANCIA_DIAS);

  let best: { indices: [number, number]; lineas: [ExtractoLinea, ExtractoLinea]; nameScore: number } | null = null;
  for (let i = 0; i < enVentana.length; i++) {
    for (let j = i + 1; j < enVentana.length; j++) {
      const a = enVentana[i];
      const b = enVentana[j];
      if (a.linea.monto + b.linea.monto !== inv.total) continue;
      const nameScore = Math.max(
        nameSimilarity(inv.proveedor, a.linea.contraparte),
        nameSimilarity(inv.proveedor, b.linea.contraparte)
      );
      if (!best || nameScore > best.nameScore) {
        best = { indices: [a.index, b.index], lineas: [a.linea, b.linea], nameScore };
      }
    }
  }
  return best;
}

/**
 * Empareja cada factura con, a lo sumo, una o dos lineas del extracto.
 * Regla principal: monto exacto + fecha dentro de +-3 dias.
 * Si no hay una sola linea que cuadre, busca un pago dividido en 2 transacciones
 * cuya suma cubra el total dentro de la misma ventana de fecha (matchType "dividido").
 * Desempate entre varios candidatos: mayor similitud de nombre, luego menor diferencia de fecha.
 * Cada linea del extracto se usa como maximo una vez (greedy, en orden de fecha de factura).
 */
export function matchInvoices(invoices: Invoice[], extracto: ExtractoLinea[]): MatchResult[] {
  const disponibles = extracto.map((linea, index) => ({ linea, index }));
  const usadas = new Set<number>();

  const ordenLoop = [...invoices].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const results = new Map<Invoice, MatchResult>();

  for (const inv of ordenLoop) {
    const candidatos: Candidate[] = disponibles
      .filter(({ index }) => !usadas.has(index))
      .filter(({ linea }) => linea.monto === inv.total)
      .map(({ linea, index }) => ({
        linea,
        index,
        dateDiff: daysDiff(inv.fecha, linea.fecha),
        nameScore: nameSimilarity(inv.proveedor, linea.contraparte),
      }))
      .filter((c) => c.dateDiff <= FECHA_TOLERANCIA_DIAS);

    if (candidatos.length > 0) {
      candidatos.sort((a, b) => b.nameScore - a.nameScore || a.dateDiff - b.dateDiff);
      const best = candidatos[0];
      usadas.add(best.index);
      results.set(inv, {
        invoice: inv,
        match: best.linea,
        matchType: best.dateDiff === 0 ? "exacto" : "aproximado",
        score: best.nameScore,
      });
      continue;
    }

    const split = findSplitMatch(inv, disponibles, usadas);
    if (split) {
      usadas.add(split.indices[0]);
      usadas.add(split.indices[1]);
      results.set(inv, {
        invoice: inv,
        match: null,
        matchType: "dividido",
        score: split.nameScore,
        splitMatches: split.lineas,
      });
      continue;
    }

    results.set(inv, { invoice: inv, match: null, matchType: "sin_match", score: 0 });
  }

  // devolver en el orden original de entrada, no en el orden de procesamiento
  return invoices.map((inv) => results.get(inv)!);
}
