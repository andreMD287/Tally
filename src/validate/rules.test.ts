import { describe, it, expect } from "vitest";
import type { Invoice } from "../types.js";
import { checkArithmetic, checkIvaRate, checkNit, checkFecha } from "./rules.js";
import { validate } from "./index.js";
import { formatNit } from "../nit.js";

function baseInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    proveedor: "Proveedor Demo S.A.S.",
    nit: formatNit("900123456"),
    numeroFactura: "FAC-0001",
    fecha: "2026-08-15",
    subtotal: 100000,
    iva: 19000,
    total: 119000,
    ...overrides,
  };
}

describe("checkArithmetic", () => {
  it("pasa cuando subtotal+iva=total", () => {
    expect(checkArithmetic(baseInvoice())).toBeNull();
  });

  it("tolera hasta $2 de diferencia por redondeo", () => {
    expect(checkArithmetic(baseInvoice({ total: 119002 }))).toBeNull();
  });

  it("falla con un descuadre grande", () => {
    expect(checkArithmetic(baseInvoice({ total: 119050 }))).not.toBeNull();
  });
});

describe("checkIvaRate", () => {
  it.each([0, 0.05, 0.19])("acepta tarifa valida %s", (rate) => {
    const subtotal = 100000;
    const iva = Math.round(subtotal * rate);
    expect(checkIvaRate(baseInvoice({ subtotal, iva, total: subtotal + iva }))).toBeNull();
  });

  it("rechaza una tarifa inventada", () => {
    expect(checkIvaRate(baseInvoice({ subtotal: 100000, iva: 12000 }))).not.toBeNull();
  });
});

describe("checkNit", () => {
  it("acepta un NIT con digito de verificacion correcto", () => {
    expect(checkNit(baseInvoice({ nit: formatNit("900123456") }))).toBeNull();
  });

  it("rechaza un NIT con digito incorrecto", () => {
    expect(checkNit(baseInvoice({ nit: "900123456-0" }))).not.toBeNull();
  });

  it("rechaza NIT faltante", () => {
    expect(checkNit(baseInvoice({ nit: null }))).not.toBeNull();
  });
});

describe("checkFecha", () => {
  it("acepta una fecha valida", () => {
    expect(checkFecha(baseInvoice({ fecha: "2026-08-15" }))).toBeNull();
  });

  it("rechaza formato invalido", () => {
    expect(checkFecha(baseInvoice({ fecha: "15/08/2026" }))).not.toBeNull();
  });

  it("rechaza una fecha inexistente", () => {
    expect(checkFecha(baseInvoice({ fecha: "2026-02-30" }))).not.toBeNull();
  });
});

describe("validate", () => {
  it("una factura sana pasa todas las reglas", () => {
    const result = validate(baseInvoice());
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("acumula todos los errores, no solo el primero", () => {
    const result = validate(
      baseInvoice({ nit: null, fecha: "2026-13-40", subtotal: 100000, iva: 12000 })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
