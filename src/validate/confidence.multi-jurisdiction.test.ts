import { describe, it, expect, beforeEach } from "vitest";
import { calculateConfidence } from "./confidence.js";
import { setJurisdiction } from "./jurisdictions/index.js";
import { formatNit } from "../nit.js";
import { formatCuit } from "./jurisdictions/argentina.js";
import type { Invoice, MatchResult, ValidationResult } from "../types.js";

describe("Confidence Scoring across Multiple Jurisdictions", () => {
  beforeEach(() => {
    setJurisdiction("CO");
  });

  it("calculates high confidence for valid Colombian NIT under CO jurisdiction", () => {
    setJurisdiction("CO");
    const validNit = formatNit("900123456");
    const inv: Invoice = {
      proveedor: "Distribuciones Cafetera S.A.S.",
      nit: validNit,
      numeroFactura: "FE-1001",
      fecha: "2026-08-15",
      subtotal: 100000,
      iva: 19000,
      total: 119000,
    };
    const val: ValidationResult = { ok: true, errors: [] };
    const match: MatchResult = { invoice: inv, match: { fecha: "2026-08-15", monto: 119000, referencia: "TRX-01", contraparte: "Distribuciones Cafetera S.A.S." }, matchType: "exacto", score: 1.0 };

    const conf = calculateConfidence(inv, val, match);
    expect(conf.percentage).toBe(100);
    expect(conf.level).toBe("alta");
  });

  it("calculates high confidence for valid Argentine CUIT under AR jurisdiction", () => {
    setJurisdiction("AR");
    const validCuit = formatCuit("3050000012");
    const inv: Invoice = {
      proveedor: "Transportes Pampeanos S.R.L.",
      nit: validCuit,
      numeroFactura: "A-0001",
      fecha: "2026-08-15",
      subtotal: 100000,
      iva: 21000,
      total: 121000,
    };
    const val: ValidationResult = { ok: true, errors: [] };
    const match: MatchResult = { invoice: inv, match: { fecha: "2026-08-15", monto: 121000, referencia: "TRX-02", contraparte: "Transportes Pampeanos S.R.L." }, matchType: "exacto", score: 1.0 };

    const conf = calculateConfidence(inv, val, match);
    expect(conf.factors.nit.ok).toBe(true);
    expect(conf.percentage).toBe(100);
  });

  it("calculates high confidence for valid Mexican RFC under MX jurisdiction", () => {
    setJurisdiction("MX");
    const inv: Invoice = {
      proveedor: "Comercializadora del Norte S.A. de C.V.",
      nit: "ABC680524P76",
      numeroFactura: "FAC-901",
      fecha: "2026-08-15",
      subtotal: 100000,
      iva: 16000,
      total: 116000,
    };
    const val: ValidationResult = { ok: true, errors: [] };
    const match: MatchResult = { invoice: inv, match: { fecha: "2026-08-15", monto: 116000, referencia: "TRX-03", contraparte: "Comercializadora del Norte S.A. de C.V." }, matchType: "exacto", score: 1.0 };

    const conf = calculateConfidence(inv, val, match);
    expect(conf.factors.nit.ok).toBe(true);
    expect(conf.percentage).toBe(100);
  });
});
