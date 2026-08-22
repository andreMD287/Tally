import type { Invoice, MatchResult, ValidationResult } from "../types.js";
import { isValidNit } from "../nit.js";

export interface ConfidenceBreakdown {
  score: number; // 0.0 a 1.0
  percentage: number; // 0 a 100
  level: "alta" | "media" | "baja";
  factors: {
    arithmetic: { ok: boolean; weight: number; points: number };
    nit: { ok: boolean; weight: number; points: number };
    bankMatch: { type: string; weight: number; points: number };
    date: { ok: boolean; weight: number; points: number };
  };
}

/**
 * Cuantifica la confianza y honestidad del resultado de conciliación.
 * Un agente que señala incertidumbre es superior a uno que alucina con confianza.
 */
export function calculateConfidence(
  invoice: Invoice,
  validation: ValidationResult,
  match: MatchResult
): ConfidenceBreakdown {
  const diff = Math.abs(invoice.subtotal + invoice.iva - invoice.total);
  const arithmeticOk = diff <= 2;
  const arithmeticPoints = arithmeticOk ? 0.35 : 0;

  const nitOk = invoice.nit ? isValidNit(invoice.nit) : false;
  const nitPoints = nitOk ? 0.25 : invoice.nit === null ? 0.1 : 0;

  let matchPoints = 0;
  if (match.matchType === "exacto") matchPoints = 0.25;
  else if (match.matchType === "dividido") matchPoints = 0.25;
  else if (match.matchType === "aproximado") matchPoints = 0.15;
  else matchPoints = 0;

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(invoice.fecha);
  const datePoints = dateOk ? 0.15 : 0;

  const totalPoints = Math.min(1.0, Math.round((arithmeticPoints + nitPoints + matchPoints + datePoints) * 100) / 100);
  const percentage = Math.round(totalPoints * 100);

  let level: "alta" | "media" | "baja" = "baja";
  if (percentage >= 80) level = "alta";
  else if (percentage >= 50) level = "media";

  return {
    score: totalPoints,
    percentage,
    level,
    factors: {
      arithmetic: { ok: arithmeticOk, weight: 0.35, points: arithmeticPoints },
      nit: { ok: nitOk, weight: 0.25, points: nitPoints },
      bankMatch: { type: match.matchType, weight: 0.25, points: matchPoints },
      date: { ok: dateOk, weight: 0.15, points: datePoints },
    },
  };
}
