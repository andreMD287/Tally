import type { JurisdictionRule } from "./types.js";

/**
 * Validador genérico internacional para facturas globales (USA EIN, Europa VAT, etc.).
 */
export const globalJurisdiction: JurisdictionRule = {
  code: "GLOBAL",
  countryName: "Global / Universal",
  taxIdName: "Tax ID / VAT / EIN",
  validIvaRates: [0, 0.04, 0.05, 0.07, 0.10, 0.16, 0.19, 0.20, 0.21, 0.27],
  validateTaxId: (taxId: string) => {
    const cleaned = taxId.trim().replace(/[-\s]/g, "");
    const isValid = cleaned.length >= 6 && cleaned.length <= 20;
    return {
      isValid,
      error: isValid ? undefined : `Identificación fiscal no válida o con longitud incorrecta: ${taxId}`,
    };
  },
};
