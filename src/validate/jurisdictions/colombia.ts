import type { JurisdictionRule } from "./types.js";
import { isValidNit } from "../../nit.js";

export const colombiaJurisdiction: JurisdictionRule = {
  code: "CO",
  countryName: "Colombia (DIAN)",
  taxIdName: "NIT",
  validIvaRates: [0, 0.05, 0.19],
  validateTaxId: (taxId: string) => {
    const valid = isValidNit(taxId);
    return {
      isValid: valid,
      error: valid ? undefined : `Dígito de verificación de NIT DIAN inválido: ${taxId}`,
    };
  },
};
