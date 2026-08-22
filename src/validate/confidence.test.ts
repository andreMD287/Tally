import { describe, it, expect } from "vitest";
import { calculateConfidence } from "./confidence.js";
import type { Invoice, MatchResult, ValidationResult } from "../types.js";
import { formatNit } from "../nit.js";

describe("calculateConfidence", () => {
  const validInvoice: Invoice = {
    proveedor: "Comercializadora SAS",
    nit: formatNit("900123456"),
    numeroFactura: "FAC-001",
    fecha: "2026-08-15",
    subtotal: 100000,
    iva: 19000,
    total: 119000,
  };

  const okValidation: ValidationResult = { ok: true, errors: [] };

  it("asigna confianza alta (100%) cuando aritmética, NIT, fecha y match bancario exacto son perfectos", () => {
    const exactMatch: MatchResult = {
      invoice: validInvoice,
      match: { fecha: "2026-08-15", monto: 119000, contraparte: "Comercializadora", referencia: "TRX1" },
      matchType: "exacto",
      score: 1.0,
    };

    const res = calculateConfidence(validInvoice, okValidation, exactMatch);
    expect(res.level).toBe("alta");
    expect(res.percentage).toBe(100);
    expect(res.score).toBe(1.0);
  });

  it("penaliza adecuadamente cuando hay descuadre aritmético", () => {
    const badMathInvoice: Invoice = {
      ...validInvoice,
      total: 125000, // No cuadra 100000 + 19000
    };
    const exactMatch: MatchResult = {
      invoice: badMathInvoice,
      match: { fecha: "2026-08-15", monto: 125000, contraparte: "Comercializadora", referencia: "TRX1" },
      matchType: "exacto",
      score: 1.0,
    };

    const res = calculateConfidence(badMathInvoice, { ok: false, errors: ["Descuadre"] }, exactMatch);
    expect(res.percentage).toBe(65);
    expect(res.factors.arithmetic.ok).toBe(false);
  });

  it("penaliza cuando no se encuentra pago en extracto", () => {
    const noMatch: MatchResult = {
      invoice: validInvoice,
      match: null,
      matchType: "sin_match",
      score: 0,
    };

    const res = calculateConfidence(validInvoice, okValidation, noMatch);
    expect(res.percentage).toBe(75);
    expect(res.level).toBe("media");
    expect(res.factors.bankMatch.points).toBe(0);
  });

  it("clasifica como baja confianza si falla aritmética y tampoco hay match", () => {
    const badInvoice: Invoice = {
      ...validInvoice,
      nit: "123456-0", // NIT inválido
      total: 999999, // Descuadre
    };
    const noMatch: MatchResult = {
      invoice: badInvoice,
      match: null,
      matchType: "sin_match",
      score: 0,
    };

    const res = calculateConfidence(badInvoice, { ok: false, errors: ["Error"] }, noMatch);
    expect(res.level).toBe("baja");
    expect(res.percentage).toBe(15);
  });
});
