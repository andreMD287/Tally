import type { JurisdictionRule } from "./types.js";

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Calcula el dígito de verificación oficial de CUIT (Argentina - ARCA / AFIP).
 */
export function calculateCuitCheckDigit(first10Digits: string): number {
  const digits = first10Digits.replace(/\D/g, "").slice(0, 10).split("").map(Number);
  if (digits.length !== 10) return -1;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * CUIT_WEIGHTS[i];
  }
  const rem = sum % 11;
  if (rem === 0) return 0;
  if (rem === 1) return 9; // Regla general de excepción AFIP
  return 11 - rem;
}

export function formatCuit(typeAndNumber: string): string {
  const clean = typeAndNumber.replace(/\D/g, "");
  const base = clean.slice(0, 10);
  const dv = calculateCuitCheckDigit(base);
  return `${base.slice(0, 2)}-${base.slice(2, 10)}-${dv}`;
}

/**
 * Validador oficial de CUIT de la República Argentina (ARCA / AFIP).
 */
export function isValidCuit(cuit: string): boolean {
  const cleaned = cuit.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  const first10 = cleaned.slice(0, 10);
  const dv = Number(cleaned[10]);
  return calculateCuitCheckDigit(first10) === dv;
}

export const argentinaJurisdiction: JurisdictionRule = {
  code: "AR",
  countryName: "Argentina (ARCA / AFIP)",
  taxIdName: "CUIT",
  validIvaRates: [0, 0.105, 0.21, 0.27],
  validateTaxId: (taxId: string) => {
    const valid = isValidCuit(taxId);
    return {
      isValid: valid,
      error: valid ? undefined : `Dígito de verificación de CUIT ARCA/AFIP inválido: ${taxId}`,
    };
  },
};
