import { performance } from "node:perf_hooks";
import { InvoiceSchema, type ExtractFn, type ExtractResult, type Invoice } from "../types.js";
import { runQvacMultimodal } from "../qvac/client.js";

const EXTRACTION_PROMPT = `Eres un extractor de facturas comerciales. Analiza la imagen de la factura y extrae la información en un objeto JSON con esta estructura exacta:
{
  "proveedor": "Nombre o Razon Social del emisor",
  "nit": "NIT con o sin digito de verificacion, o null",
  "numeroFactura": "Codigo de la factura (ej: FAC-0001, REC-0004) o null",
  "fecha": "YYYY-MM-DD",
  "subtotal": 100000,
  "iva": 19000,
  "total": 119000
}

Reglas estrictas:
- subtotal, iva y total DEBEN ser números (sin comas de miles, sin signo de pesos).
- fecha DEBE estar en formato YYYY-MM-DD.
- Devuelve SOLAMENTE el objeto JSON válido, sin texto adicional ni bloques explicativos.`;

/**
 * Limpia y normaliza el texto retornado por el VLM para convertirlo en JSON parseable.
 */
function cleanJsonOutput(raw: string): any {
  let cleaned = raw.trim();

  // Eliminar bloques ```json ... ```
  if (cleaned.includes("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // Si aún contiene texto circundante, buscar el primer { y el último }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);

  // Normalizar campos numéricos si vinieron como strings o con formato
  const parseNum = (val: any): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const sanitized = val.replace(/[$ ]/g, "").replace(/\./g, "").replace(/,/g, ".");
      const num = Number(sanitized);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  return {
    proveedor: String(parsed.proveedor ?? "").trim(),
    nit: parsed.nit ? String(parsed.nit).trim() : null,
    numeroFactura: parsed.numeroFactura ? String(parsed.numeroFactura).trim() : null,
    fecha: String(parsed.fecha ?? "").trim(),
    subtotal: parseNum(parsed.subtotal),
    iva: parseNum(parsed.iva),
    total: parseNum(parsed.total),
  };
}

/**
 * Extractor real basado en QVAC y SmolVLM2.
 */
export const qvacExtract: ExtractFn = async (imagePath: string): Promise<ExtractResult> => {
  const start = performance.now();
  let attempts = 0;
  let lastError: string | undefined;
  let lastRaw = "";

  const MAX_ATTEMPTS = 2;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    try {
      lastRaw = await runQvacMultimodal(imagePath, EXTRACTION_PROMPT);
      const cleaned = cleanJsonOutput(lastRaw);
      const validation = InvoiceSchema.safeParse(cleaned);

      if (validation.success) {
        const latencyMs = Math.round(performance.now() - start);
        return {
          invoice: validation.data,
          raw: lastRaw,
          attempts,
          latencyMs,
        };
      } else {
        lastError = `Validación de esquema Zod fallida: ${validation.error.message}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  return {
    invoice: null,
    raw: lastRaw,
    attempts,
    latencyMs,
    error: lastError ?? "Fallo desconocido en extracción",
  };
};
