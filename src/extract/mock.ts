import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ExtractFn, Invoice } from "../types.js";
import { formatNit } from "../nit.js";

let cachedGt: Map<string, Invoice> | null = null;

async function getGtItem(filename: string): Promise<Invoice | undefined> {
  if (!cachedGt) {
    try {
      const gtPath = path.resolve("data", "ground_truth.json");
      const raw = JSON.parse(await readFile(gtPath, "utf-8")) as { file: string; invoice: Invoice }[];
      cachedGt = new Map(raw.map((r) => [path.basename(r.file), r.invoice]));
    } catch {
      cachedGt = new Map();
    }
  }
  return cachedGt.get(filename);
}

/**
 * Mock de extracción. Si existe data/ground_truth.json, busca la factura por nombre de archivo;
 * de lo contrario, devuelve un registro sintético por defecto.
 */
export const mockExtract: ExtractFn = async (imagePath: string) => {
  const filename = path.basename(imagePath);
  const gtInvoice = await getGtItem(filename);

  if (gtInvoice) {
    return {
      invoice: gtInvoice,
      raw: JSON.stringify(gtInvoice),
      attempts: 1,
      latencyMs: 8,
    };
  }

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
