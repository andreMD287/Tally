import { describe, it, expect } from "vitest";
import { dedupeByInvoiceNumber } from "./dedupe.js";
import type { Invoice } from "../types.js";

function item(file: string, overrides: Partial<Invoice> = {}) {
  const invoice: Invoice = {
    proveedor: "Proveedor Demo S.A.S.",
    nit: "900123456-8",
    numeroFactura: "FAC-0001",
    fecha: "2026-08-15",
    subtotal: 100000,
    iva: 19000,
    total: 119000,
    ...overrides,
  };
  return { file, invoice };
}

describe("dedupeByInvoiceNumber", () => {
  it("deja pasar facturas con numero distinto", () => {
    const { unicas, duplicadas } = dedupeByInvoiceNumber([
      item("a.png", { numeroFactura: "FAC-0001" }),
      item("b.png", { numeroFactura: "FAC-0002" }),
    ]);
    expect(unicas).toHaveLength(2);
    expect(duplicadas).toHaveLength(0);
  });

  it("detecta el mismo numero+total reenviado como duplicado", () => {
    const { unicas, duplicadas } = dedupeByInvoiceNumber([
      item("original.png"),
      item("reenvio.png"),
    ]);
    expect(unicas).toHaveLength(1);
    expect(duplicadas).toHaveLength(1);
    expect(unicas[0].file).toBe("original.png");
    expect(duplicadas[0].file).toBe("reenvio.png");
  });

  it("mismo numero pero total distinto no se considera duplicado", () => {
    const { unicas, duplicadas } = dedupeByInvoiceNumber([
      item("a.png", { numeroFactura: "FAC-0001", total: 119000 }),
      item("b.png", { numeroFactura: "FAC-0001", total: 200000 }),
    ]);
    expect(unicas).toHaveLength(2);
    expect(duplicadas).toHaveLength(0);
  });

  it("facturas sin numero nunca se marcan duplicadas entre si", () => {
    const { unicas, duplicadas } = dedupeByInvoiceNumber([
      item("a.png", { numeroFactura: null }),
      item("b.png", { numeroFactura: null }),
    ]);
    expect(unicas).toHaveLength(2);
    expect(duplicadas).toHaveLength(0);
  });
});
