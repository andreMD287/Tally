import { describe, it, expect, beforeEach } from "vitest";
import { isValidCuit, formatCuit } from "./jurisdictions/argentina.js";
import { isValidRfc } from "./jurisdictions/mexico.js";
import { setJurisdiction, getActiveJurisdiction, validate } from "./index.js";
import type { Invoice } from "../types.js";

describe("Multi-Jurisdiction Tax Validation (Colombia, Argentina, México, Global)", () => {
  beforeEach(() => {
    setJurisdiction("CO"); // Reset to Colombia default
  });

  describe("Argentina (ARCA / AFIP)", () => {
    it("valida CUITs argentinos con algoritmo oficial módulo 11", () => {
      const validCuit1 = formatCuit("3050000012");
      const validCuit2 = formatCuit("2012345678");
      const validCuit3 = "33-69345023-9"; // CUIT oficial AFIP

      expect(isValidCuit(validCuit1)).toBe(true);
      expect(isValidCuit(validCuit2)).toBe(true);
      expect(isValidCuit(validCuit3)).toBe(true);
    });

    it("rechaza CUITs con dígito de verificación inválido", () => {
      expect(isValidCuit("33-69345023-0")).toBe(false);
      expect(isValidCuit("30-50000012-0")).toBe(false);
    });

    it("valida facturas argentinas con CUIT e IVA 21%", () => {
      setJurisdiction("AR");
      expect(getActiveJurisdiction().code).toBe("AR");

      const validCuit = formatCuit("3070805500");
      const invoiceAr: Invoice = {
        proveedor: "Tecnología Sur S.A.",
        nit: validCuit,
        numeroFactura: "0001-00004521",
        fecha: "2026-08-15",
        subtotal: 100000,
        iva: 21000, // 21% IVA Argentina
        total: 121000,
      };

      const result = validate(invoiceAr);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("México (SAT)", () => {
    it("valida RFCs de persona moral y persona física", () => {
      expect(isValidRfc("ABC680524P76")).toBe(true); // Persona moral
      expect(isValidRfc("MECG850101XYZ")).toBe(true); // Persona física
    });

    it("rechaza RFCs con estructura inválida", () => {
      expect(isValidRfc("INVALID_RFC_123")).toBe(false);
      expect(isValidRfc("123456789")).toBe(false);
    });

    it("valida facturas mexicanas con RFC e IVA 16%", () => {
      setJurisdiction("MX");
      expect(getActiveJurisdiction().code).toBe("MX");

      const invoiceMx: Invoice = {
        proveedor: "Soluciones Digitales SA de CV",
        nit: "ABC680524P76",
        numeroFactura: "FAC-9841",
        fecha: "2026-08-10",
        subtotal: 50000,
        iva: 8000, // 16% IVA México
        total: 58000,
      };

      const result = validate(invoiceMx);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Global / Universal", () => {
    it("valida facturas internacionales con Tax ID y tasas globales", () => {
      setJurisdiction("GLOBAL");
      const invoiceGlobal: Invoice = {
        proveedor: "Acme Corp USA",
        nit: "US-94-3294810",
        numeroFactura: "INV-2026-001",
        fecha: "2026-08-01",
        subtotal: 1000,
        iva: 70, // 7% State Tax
        total: 1070,
      };

      const result = validate(invoiceGlobal);
      expect(result.ok).toBe(true);
    });
  });
});
