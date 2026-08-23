import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { matchInvoices } from "./index.js";
import { parseExtractoCsv } from "../ingest/extracto.js";
import type { ExtractoLinea, Invoice } from "../types.js";

function inv(overrides: Partial<Invoice>): Invoice {
  return {
    proveedor: "Proveedor Demo S.A.S.",
    nit: "900123456-7",
    numeroFactura: "FAC-0001",
    fecha: "2026-08-15",
    subtotal: 100000,
    iva: 19000,
    total: 119000,
    ...overrides,
  };
}

function linea(overrides: Partial<ExtractoLinea>): ExtractoLinea {
  return {
    fecha: "2026-08-15",
    monto: 119000,
    contraparte: "Proveedor Demo S.A.S.",
    referencia: "TRX000001",
    ...overrides,
  };
}

describe("matchInvoices - casos unitarios", () => {
  it("match exacto: mismo monto, misma fecha", () => {
    const [r] = matchInvoices([inv({})], [linea({})]);
    expect(r.matchType).toBe("exacto");
    expect(r.match).not.toBeNull();
  });

  it("match aproximado: mismo monto, fecha +2 dias", () => {
    const [r] = matchInvoices([inv({})], [linea({ fecha: "2026-08-17" })]);
    expect(r.matchType).toBe("aproximado");
  });

  it("sin match: fecha fuera de tolerancia (+5 dias)", () => {
    const [r] = matchInvoices([inv({})], [linea({ fecha: "2026-08-20" })]);
    expect(r.matchType).toBe("sin_match");
    expect(r.match).toBeNull();
  });

  it("sin match: monto distinto", () => {
    const [r] = matchInvoices([inv({})], [linea({ monto: 5000 })]);
    expect(r.matchType).toBe("sin_match");
  });

  it("desempata por similitud de nombre cuando hay varios candidatos", () => {
    const facturas = [inv({ proveedor: "Ferreteria El Roble S.A.S.", numeroFactura: "FAC-A" })];
    const lineas = [
      linea({ contraparte: "OTRO PROVEEDOR SIN RELACION", referencia: "TRX-A" }),
      linea({ contraparte: "FERRETERIA EL ROBLE", referencia: "TRX-B" }),
    ];
    const [r] = matchInvoices(facturas, lineas);
    expect(r.match?.referencia).toBe("TRX-B");
  });

  it("no reutiliza la misma linea del extracto para dos facturas", () => {
    const facturas = [
      inv({ numeroFactura: "FAC-A", fecha: "2026-08-15" }),
      inv({ numeroFactura: "FAC-B", fecha: "2026-08-16" }),
    ];
    const lineas = [linea({ referencia: "TRX-UNICA" })];
    const results = matchInvoices(facturas, lineas);
    const conMatch = results.filter((r) => r.match !== null);
    expect(conMatch).toHaveLength(1);
  });

  it("pago dividido en dos transacciones: matchType 'dividido' con splitMatches", () => {
    const facturas = [inv({ total: 5000, fecha: "2026-08-15" })];
    const lineas = [
      linea({ monto: 2500, fecha: "2026-08-14", referencia: "TRX-A" }),
      linea({ monto: 2500, fecha: "2026-08-16", referencia: "TRX-B" }),
    ];
    const [r] = matchInvoices(facturas, lineas);
    expect(r.matchType).toBe("dividido");
    expect(r.match).toBeNull();
    expect(r.splitMatches?.map((l) => l.referencia).sort()).toEqual(["TRX-A", "TRX-B"]);
  });

  it("no arma un pago dividido con una linea fuera de la ventana de fecha", () => {
    const facturas = [inv({ total: 5000, fecha: "2026-08-15" })];
    const lineas = [
      linea({ monto: 2500, fecha: "2026-08-14", referencia: "TRX-A" }),
      linea({ monto: 2500, fecha: "2026-08-25", referencia: "TRX-B" }),
    ];
    const [r] = matchInvoices(facturas, lineas);
    expect(r.matchType).toBe("sin_match");
  });

  it("devuelve los resultados en el mismo orden que las facturas de entrada", () => {
    const facturas = [
      inv({ numeroFactura: "FAC-Z", total: 200000 }),
      inv({ numeroFactura: "FAC-A", total: 119000 }),
    ];
    const results = matchInvoices(facturas, [linea({})]);
    expect(results.map((r) => r.invoice.numeroFactura)).toEqual(["FAC-Z", "FAC-A"]);
  });
});

const gtPath = path.resolve("data/ground_truth.json");
const extractoPath = path.resolve("data/extracto.csv");
const hasDataset = existsSync(gtPath) && existsSync(extractoPath);

describe.skipIf(!hasDataset)("matchInvoices contra el dataset generado", () => {
  // skipIf solo salta los it() de abajo; vitest igual ejecuta el cuerpo del describe durante la
  // coleccion de tests, asi que leer el archivo sin el guard de hasDataset revienta con ENOENT
  // en un clon limpio que aun no corrio `npm run gen:dataset`.
  const entries: { invoice: Invoice }[] = hasDataset ? JSON.parse(readFileSync(gtPath, "utf-8")) : [];
  const invoices = entries.map((e) => e.invoice);
  const extracto = hasDataset ? parseExtractoCsv(readFileSync(extractoPath, "utf-8")) : [];

  it("aproximadamente el 70% de las facturas encuentra pago", () => {
    const results = matchInvoices(invoices, extracto);
    const conMatch = results.filter((r) => r.matchType !== "sin_match").length;
    const ratio = conMatch / invoices.length;
    expect(ratio).toBeGreaterThan(0.55);
    expect(ratio).toBeLessThan(0.85);
  });

  it("nunca asigna la misma linea de extracto a dos facturas", () => {
    const results = matchInvoices(invoices, extracto);
    const referencias = results.filter((r) => r.match).map((r) => r.match!.referencia);
    expect(new Set(referencias).size).toBe(referencias.length);
  });
});
