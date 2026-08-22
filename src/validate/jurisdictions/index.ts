import { colombiaJurisdiction } from "./colombia.js";
import { argentinaJurisdiction, isValidCuit } from "./argentina.js";
import { mexicoJurisdiction, isValidRfc } from "./mexico.js";
import { globalJurisdiction } from "./global.js";
import type { JurisdictionRule } from "./types.js";

export * from "./types.js";
export * from "./colombia.js";
export * from "./argentina.js";
export * from "./mexico.js";
export * from "./global.js";

const JURISDICTIONS: Record<string, JurisdictionRule> = {
  CO: colombiaJurisdiction,
  AR: argentinaJurisdiction,
  MX: mexicoJurisdiction,
  GLOBAL: globalJurisdiction,
};

let activeJurisdiction: JurisdictionRule = colombiaJurisdiction;

export function setJurisdiction(code: "CO" | "AR" | "MX" | "GLOBAL" | string): void {
  const upper = code.toUpperCase();
  if (JURISDICTIONS[upper]) {
    activeJurisdiction = JURISDICTIONS[upper];
  } else {
    activeJurisdiction = globalJurisdiction;
  }
}

export function getActiveJurisdiction(): JurisdictionRule {
  return activeJurisdiction;
}

/**
 * Autodetecta la jurisdicción según el formato del número fiscal.
 */
export function autoDetectJurisdiction(taxId: string): JurisdictionRule {
  if (isValidCuit(taxId)) return argentinaJurisdiction;
  if (isValidRfc(taxId)) return mexicoJurisdiction;
  return colombiaJurisdiction;
}
