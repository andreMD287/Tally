import type { Invoice, ValidateFn, ValidationResult } from "../types.js";
import { ALL_RULES } from "./rules.js";

export const validate: ValidateFn = (inv: Invoice): ValidationResult => {
  const errors = ALL_RULES.map((rule) => rule(inv)).filter((e): e is string => e !== null);
  return { ok: errors.length === 0, errors };
};

export * from "./rules.js";
