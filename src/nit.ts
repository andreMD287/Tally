/**
 * Digito de verificacion de NIT (algoritmo DIAN, Colombia).
 * Compartido entre el generador de dataset y validate().
 */

const WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function nitCheckDigit(base: string): number {
  const digits = base
    .split("")
    .reverse()
    .map((d) => Number(d));
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * WEIGHTS[i];
  }
  const rem = sum % 11;
  return rem <= 1 ? rem : 11 - rem;
}

export function formatNit(base: string): string {
  return `${base}-${nitCheckDigit(base)}`;
}

/** true si "900123456-7" tiene el digito de verificacion correcto. */
export function isValidNit(nit: string): boolean {
  const match = /^(\d{6,15})-(\d)$/.exec(nit.trim());
  if (!match) return false;
  const [, base, dv] = match;
  return nitCheckDigit(base) === Number(dv);
}
