import type { Invoice } from "../types.js";
import { getActiveJurisdiction } from "./jurisdictions/index.js";

const ARITH_TOLERANCE = 2; // margen por redondeo
const IVA_RATE_TOLERANCE = 0.005;

/** subtotal + iva debe cuadrar con total, +-$2 de margen por redondeo. */
export function checkArithmetic(inv: Invoice): string | null {
  const expected = inv.subtotal + inv.iva;
  const diff = Math.abs(expected - inv.total);
  if (diff > ARITH_TOLERANCE) {
    return `Descuadre aritmetico: subtotal+iva=${expected} pero total=${inv.total} (diff=${diff})`;
  }
  return null;
}

/** La tarifa de IVA implicita debe coincidir con las tarifas válidas de la jurisdicción activa. */
export function checkIvaRate(inv: Invoice): string | null {
  if (inv.subtotal <= 0) {
    return inv.iva !== 0 ? `IVA distinto de cero con subtotal <= 0` : null;
  }
  const jurisdiction = getActiveJurisdiction();
  const rates = jurisdiction.validIvaRates;
  const rate = inv.iva / inv.subtotal;
  const closest = rates.reduce((best, r) => (Math.abs(r - rate) < Math.abs(best - rate) ? r : best));
  if (Math.abs(rate - closest) > IVA_RATE_TOLERANCE) {
    return `Tarifa de IVA no reconocida: ${(rate * 100).toFixed(2)}% (mas cercana valida: ${closest * 100}%)`;
  }
  return null;
}

/** Identificación tributaria (NIT / CUIT / RFC / Tax ID) presente y válida según la jurisdicción activa. */
export function checkNit(inv: Invoice): string | null {
  const jurisdiction = getActiveJurisdiction();
  if (!inv.nit) return `${jurisdiction.taxIdName} faltante`;
  const result = jurisdiction.validateTaxId(inv.nit);
  if (!result.isValid) {
    return result.error ?? `Digito de verificacion de ${jurisdiction.taxIdName} invalido: ${inv.nit}`;
  }
  return null;
}

/** Fecha en formato YYYY-MM-DD y calendario valido. */
export function checkFecha(inv: Invoice): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(inv.fecha);
  if (!match) return `Formato de fecha invalido: ${inv.fecha}`;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const isRealDate = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  if (!isRealDate) return `Fecha inexistente en el calendario: ${inv.fecha}`;
  return null;
}

export const ALL_RULES = [checkArithmetic, checkIvaRate, checkNit, checkFecha];
