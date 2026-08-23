import { performance } from "node:perf_hooks";
import { InvoiceSchema, type ExtractFn, type ExtractResult } from "../types.js";
import { runQvacMultimodal } from "../qvac/client.js";
import { prepareInvoiceForExtraction } from "../ingest/pdf.js";

/**
 * OJO: no mostrar un JSON de ejemplo relleno aca (ni con numeros "creibles" tipo 100000,
 * ni con placeholders tipo <string>). Probado en vivo dos veces: un VLM de 460-500M copia
 * literalmente CUALQUIER texto que vea en el "molde", sea un numero redondo o un token
 * como <string>, en vez de leer la imagen adjunta. La forma del JSON la fuerza
 * responseFormat.json_schema (ver INVOICE_JSON_SCHEMA); el prompt solo describe que
 * campo va en cada llave, en prosa, sin darle nada literal para copiar.
 */
const EXTRACTION_PROMPT = `Eres un extractor de datos OCR. Observa con atencion la imagen de factura adjunta y transcribe EXACTAMENTE los caracteres impresos en ella. No inventes valores ni completes con datos tipicos de una factura: si no puedes leer un campo, usa cadena vacia "" (texto) o 0 (numeros).

Extrae estos 7 campos leyendo la imagen con cuidado, digito por digito:
1. proveedor: nombre o razon social del emisor, tal como esta impreso.
2. nit: identificacion tributaria del emisor (NIT/CUIT/RFC), tal como esta impresa.
3. numeroFactura: numero o codigo de la factura, tal como esta impreso.
4. fecha: fecha de emision de la factura, convertida a formato YYYY-MM-DD.
5. subtotal: valor del subtotal (antes de impuestos) impreso en la factura, como numero, sin simbolos ni separadores de miles.
6. iva: valor del IVA/impuesto impreso en la factura, como numero, sin simbolos ni separadores de miles.
7. total: valor total (con impuestos) impreso en la factura, como numero, sin simbolos ni separadores de miles.

Responde unicamente con el objeto JSON de esos 7 campos, sin texto adicional ni bloques explicativos.`;

/** JSON Schema (no Zod) para responseFormat: json_schema del SDK, que restringe la gramatica de salida via GBNF. */
const INVOICE_JSON_SCHEMA = {
  type: "object",
  properties: {
    proveedor: { type: "string" },
    nit: { type: "string" },
    numeroFactura: { type: "string" },
    fecha: { type: "string" },
    subtotal: { type: "number" },
    iva: { type: "number" },
    total: { type: "number" },
  },
  required: ["proveedor", "nit", "numeroFactura", "fecha", "subtotal", "iva", "total"],
} as const;

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

  // Normalizar campos numéricos si vinieron como strings o con formato.
  // OJO: un punto NO siempre es separador de miles (es-CO): "1234.56" es un decimal legitimo.
  // Solo se asume miles cuando hay coma+punto combinados o mas de un punto.
  const parseNum = (val: any): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      let s = val.trim().replace(/[$\s]/g, "");
      const dotCount = (s.match(/\./g) ?? []).length;
      if (s.includes(",") && s.includes(".")) {
        // es-CO: punto = miles, coma = decimal -> "1.234.567,89"
        s = s.replace(/\./g, "").replace(",", ".");
      } else if (s.includes(",") && !s.includes(".")) {
        const [intPart, decPart] = s.split(",");
        // coma con exactamente 3 digitos detras es probablemente separador de miles ("1,234")
        s = decPart && decPart.length === 3 ? s.replace(",", "") : s.replace(",", ".");
      } else if (dotCount > 1) {
        // varios puntos -> son separadores de miles ("1.234.567")
        s = s.replace(/\./g, "");
      }
      // un solo punto se deja tal cual: se interpreta como decimal
      const num = Number(s);
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
 * Defensa de ultima linea contra el "eco de plantilla": si el modelo devuelve alguno de
 * estos tokens tal cual en un campo de texto, no leyo la imagen, copio el molde. Zod no lo
 * detecta solo porque "<string>" es un string valido. Devuelve el campo si matchea uno.
 */
const TEMPLATE_ECHO_TOKENS = new Set(["<string>", "string", "<texto>", "texto", "n/a", "null", "undefined"]);
function detectTemplateEcho(inv: { proveedor: string; nit: string | null; numeroFactura: string | null }): string | null {
  const fields: [string, string | null][] = [
    ["proveedor", inv.proveedor],
    ["nit", inv.nit],
    ["numeroFactura", inv.numeroFactura],
  ];
  for (const [name, value] of fields) {
    if (value && TEMPLATE_ECHO_TOKENS.has(value.trim().toLowerCase())) {
      return `Campo "${name}" devolvio un placeholder de plantilla ("${value}") en vez de leer la imagen`;
    }
  }
  return null;
}

/**
 * Extractor real basado en QVAC y SmolVLM2.
 */
export const qvacExtract: ExtractFn = async (imagePath: string): Promise<ExtractResult> => {
  const start = performance.now();
  let attempts = 0;
  let lastError: string | undefined;
  let lastRaw = "";

  const MAX_ATTEMPTS = 3;
  const optimizedImagePath = await prepareInvoiceForExtraction(imagePath);
  const responseFormat = {
    type: "json_schema",
    json_schema: { name: "invoice_extraction", schema: INVOICE_JSON_SCHEMA },
  };

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    // En reintentos, el error de validacion anterior se inyecta en el prompt (pedido explicito del diseño original).
    const prompt =
      attempts === 1
        ? EXTRACTION_PROMPT
        : `${EXTRACTION_PROMPT}\n\nTu intento anterior fallo con este error de validacion, corrigelo releyendo la imagen con cuidado: ${lastError}`;
    try {
      lastRaw = await runQvacMultimodal(optimizedImagePath, prompt, { responseFormat });
      const cleaned = cleanJsonOutput(lastRaw);
      const validation = InvoiceSchema.safeParse(cleaned);

      if (validation.success) {
        const echoError = detectTemplateEcho(validation.data);
        if (echoError) {
          lastError = echoError;
        } else {
          const latencyMs = Math.round(performance.now() - start);
          return {
            invoice: validation.data,
            raw: lastRaw,
            attempts,
            latencyMs,
          };
        }
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
