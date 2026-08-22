import type { ExtractFn } from "../types.js";
import { formatNit } from "../nit.js";

/**
 * Mock de A. B desarrolla contra esto hasta que la extraccion real este lista.
 * No depende de QVAC, del modelo ni de Docker.
 */
export const mockExtract: ExtractFn = async (imagePath) => {
  return {
    invoice: {
      proveedor: "Proveedor Demo S.A.S.",
      nit: formatNit("900123456"),
      numeroFactura: "FAC-0001",
      fecha: "2026-08-15",
      subtotal: 100000,
      iva: 19000,
      total: 119000,
    },
    raw: `{"mock":true,"source":"${imagePath}"}`,
    attempts: 1,
    latencyMs: 5,
  };
};
