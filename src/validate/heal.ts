import type { Invoice } from "../types.js";
import { getActiveJurisdiction } from "./jurisdictions/index.js";

export interface HealResult {
  invoice: Invoice;
  healed: boolean;
  repairs: string[];
}

/**
 * Motor de Auto-Corrección Aritmética (Self-Healing).
 * Reconstruye campos faltantes o inconsistentes a partir de relaciones algebraicas y tasas fiscales.
 */
export function healInvoice(inv: Invoice): HealResult {
  const repairs: string[] = [];
  const healedInv: Invoice = { ...inv };
  const jurisdiction = getActiveJurisdiction();

  // Caso 1: Subtotal faltante/cero pero con total e IVA presentes
  if (healedInv.subtotal <= 0 && healedInv.total > 0 && healedInv.iva > 0) {
    healedInv.subtotal = healedInv.total - healedInv.iva;
    repairs.push(`Subtotal auto-calculado: $${healedInv.subtotal} (Total $${healedInv.total} - IVA $${healedInv.iva})`);
  }

  // Caso 2: Total faltante/cero pero con subtotal e IVA presentes
  if (healedInv.total <= 0 && healedInv.subtotal > 0) {
    healedInv.total = healedInv.subtotal + healedInv.iva;
    repairs.push(`Total auto-calculado: $${healedInv.total} (Subtotal $${healedInv.subtotal} + IVA $${healedInv.iva})`);
  }

  // Caso 3: IVA faltante/cero pero con subtotal y total con diferencia positiva
  if (healedInv.iva <= 0 && healedInv.total > healedInv.subtotal && healedInv.subtotal > 0) {
    const diff = healedInv.total - healedInv.subtotal;
    const implicitRate = diff / healedInv.subtotal;
    const standardRates = jurisdiction.validIvaRates.filter((r) => r > 0);
    const closest = standardRates.reduce((best, r) => (Math.abs(r - implicitRate) < Math.abs(best - implicitRate) ? r : best), standardRates[0] || 0.19);

    if (Math.abs(implicitRate - closest) < 0.02) {
      healedInv.iva = diff;
      repairs.push(`IVA auto-deducido: $${healedInv.iva} (Tarifa ${(closest * 100).toFixed(0)}% aplicada sobre diferencia)`);
    }
  }

  // Caso 4: Descuadre de redondeo menor a $5 COP/ARS/MXN
  const expectedTotal = healedInv.subtotal + healedInv.iva;
  const diffTotal = Math.abs(expectedTotal - healedInv.total);
  if (diffTotal > 0 && diffTotal <= 5) {
    repairs.push(`Ajuste de redondeo de centavos/pesos: $${diffTotal}`);
    healedInv.total = expectedTotal;
  }

  return {
    invoice: healedInv,
    healed: repairs.length > 0,
    repairs,
  };
}
