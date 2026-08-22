import type { Invoice } from "../types.js";
import { isValidNit } from "../nit.js";

const IVA_RATES = [0, 0.05, 0.19];
const ARITH_TOLERANCE = 2; // pesos
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

/** La tarifa de IVA implicita debe ser 0%, 5% o 19% (+-0.5%). */
export function checkIvaRate(inv: Invoice): string | null {
  if (inv.subtotal <= 0) {
    return inv.iva !== 0 ? `IVA distinto de cero con subtotal <= 0` : null;
  }
  const rate = inv.iva / inv.subtotal;
  const closest = IVA_RATES.reduce((best, r) => (Math.abs(r - rate) < Math.abs(best - rate) ? r : best));
  if (Math.abs(rate - closest) > IVA_RATE_TOLERANCE) {
    return `Tarifa de IVA no reconocida: ${(rate * 100).toFixed(2)}% (mas cercana valida: ${closest * 100}%)`;
  }
  return null;
}

/** NIT presente y con digito de verificacion correcto. */
export function checkNit(inv: Invoice): string | null {
  if (!inv.nit) return "NIT faltante";
  if (!isValidNit(inv.nit)) return `Digito de verificacion de NIT invalido: ${inv.nit}`;
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
