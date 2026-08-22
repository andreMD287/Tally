import type { JurisdictionRule } from "./types.js";

/**
 * Validador oficial de estructura de RFC (México - SAT).
 * Soporta Personas Morales (12 caracteres) y Personas Físicas (13 caracteres) con homoclave.
 */
export function isValidRfc(rfc: string): boolean {
  const cleaned = rfc.trim().toUpperCase().replace(/[-\s]/g, "");
  const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/;
  return rfcRegex.test(cleaned);
}

export const mexicoJurisdiction: JurisdictionRule = {
  code: "MX",
  countryName: "México (SAT)",
  taxIdName: "RFC",
  validIvaRates: [0, 0.08, 0.16],
  validateTaxId: (taxId: string) => {
    const valid = isValidRfc(taxId);
    return {
      isValid: valid,
      error: valid ? undefined : `Estructura de RFC SAT no válida: ${taxId}`,
    };
  },
};
