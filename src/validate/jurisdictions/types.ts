import type { Invoice } from "../../types.js";

export interface JurisdictionRule {
  code: "CO" | "AR" | "MX" | "GLOBAL";
  countryName: string;
  taxIdName: string; // "NIT", "CUIT", "RFC", "Tax ID / VAT"
  validIvaRates: number[];
  validateTaxId: (taxId: string) => { isValid: boolean; error?: string };
}
