import { z } from "zod";

/**
 * El contrato entre A (inferencia) y B (pipeline).
 * Nadie cambia este archivo sin avisar en el chat del equipo.
 */

export const InvoiceSchema = z.object({
  proveedor: z.string(),
  nit: z.string().nullable(),
  numeroFactura: z.string().nullable(),
  fecha: z.string(), // YYYY-MM-DD
  subtotal: z.number(),
  iva: z.number(),
  total: z.number(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export interface ExtractResult {
  invoice: Invoice | null;
  raw: string;
  attempts: number;
  latencyMs: number;
  error?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** A implementa esto. */
export type ExtractFn = (imagePath: string) => Promise<ExtractResult>;

/** B implementa esto. */
export type ValidateFn = (inv: Invoice) => ValidationResult;

export interface ExtractoLinea {
  fecha: string; // YYYY-MM-DD
  monto: number;
  contraparte: string;
  referencia: string;
}

export interface MatchResult {
  invoice: Invoice;
  match: ExtractoLinea | null;
  matchType: "exacto" | "aproximado" | "dividido" | "sin_match";
  score: number;
  /** Solo cuando matchType === "dividido": las 2+ lineas cuya suma cubre el total de la factura. */
  splitMatches?: ExtractoLinea[];
}
