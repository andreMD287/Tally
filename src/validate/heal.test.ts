import { describe, it, expect } from "vitest";
import { healInvoice } from "./heal.js";
import type { Invoice } from "../types.js";

describe("Self-Healing Engine (Auto-Corrección Aritmética)", () => {
  it("reconstruye subtotal cuando solo total e IVA fueron leídos por el VLM", () => {
    const brokenInv: Invoice = {
      proveedor: "Proveedor Test SAS",
      nit: "900123456-1",
      numeroFactura: "FAC-101",
      fecha: "2026-08-15",
      subtotal: 0, // Faltante
      iva: 19000,
      total: 119000,
    };

    const result = healInvoice(brokenInv);
    expect(result.healed).toBe(true);
    expect(result.invoice.subtotal).toBe(100000);
    expect(result.repairs[0]).toContain("Subtotal auto-calculado");
  });

  it("reconstruye total cuando solo subtotal e IVA están presentes", () => {
    const brokenInv: Invoice = {
      proveedor: "Proveedor Test SAS",
      nit: "900123456-1",
      numeroFactura: "FAC-102",
      fecha: "2026-08-15",
      subtotal: 500000,
      iva: 95000,
      total: 0, // Faltante
    };

    const result = healInvoice(brokenInv);
    expect(result.healed).toBe(true);
    expect(result.invoice.total).toBe(595000);
  });

  it("deduce IVA implícito cuando la diferencia coincide con la tarifa tributaria", () => {
    const brokenInv: Invoice = {
      proveedor: "Proveedor Test SAS",
      nit: "900123456-1",
      numeroFactura: "FAC-103",
      fecha: "2026-08-15",
      subtotal: 100000,
      iva: 0, // Faltante
      total: 119000,
    };

    const result = healInvoice(brokenInv);
    expect(result.healed).toBe(true);
    expect(result.invoice.iva).toBe(19000);
  });

  it("no modifica facturas que ya son consistentes", () => {
    const cleanInv: Invoice = {
      proveedor: "Proveedor Test SAS",
      nit: "900123456-1",
      numeroFactura: "FAC-104",
      fecha: "2026-08-15",
      subtotal: 100000,
      iva: 19000,
      total: 119000,
    };

    const result = healInvoice(cleanInv);
    expect(result.healed).toBe(false);
    expect(result.repairs).toHaveLength(0);
  });
});
