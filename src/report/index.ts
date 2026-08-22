import type { Invoice, MatchResult, ValidationResult } from "../types.js";

export interface Reconciled {
  sourceFile: string;
  invoice: Invoice;
  validation: ValidationResult;
  match: MatchResult;
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const LIBRO_HEADERS = [
  "archivo",
  "numeroFactura",
  "proveedor",
  "nit",
  "fecha",
  "subtotal",
  "iva",
  "total",
  "validacion",
  "errores",
  "conciliacion",
  "referenciaPago",
];

export function buildLibroComprasCsv(rows: Reconciled[]): string {
  const lines = rows.map((r) => {
    const cols = [
      r.sourceFile,
      r.invoice.numeroFactura ?? "",
      r.invoice.proveedor,
      r.invoice.nit ?? "",
      r.invoice.fecha,
      r.invoice.subtotal,
      r.invoice.iva,
      r.invoice.total,
      r.validation.ok ? "OK" : "ERROR",
      r.validation.errors.join(" | "),
      r.match.matchType,
      r.match.match?.referencia ?? r.match.splitMatches?.map((l) => l.referencia).join(" + ") ?? "",
    ];
    return cols.map(csvEscape).join(",");
  });
  return [LIBRO_HEADERS.join(","), ...lines].join("\n") + "\n";
}

function resumenFactura(r: Reconciled): string {
  return `**${r.invoice.numeroFactura ?? "(sin numero)"}** — ${r.invoice.proveedor} — ${r.invoice.fecha} — $${r.invoice.total.toLocaleString("es-CO")}`;
}

export function buildDiscrepanciasMd(rows: Reconciled[], duplicadas: Reconciled[] = []): string {
  const conProblema = rows.filter((r) => !r.validation.ok || r.match.matchType === "sin_match");
  const sinProblema = rows.length - conProblema.length;

  const secciones: string[] = [];
  secciones.push(`# Discrepancias\n`);
  secciones.push(
    `${rows.length} facturas procesadas. ${sinProblema} sin problemas. ${conProblema.length} requieren revision.` +
      (duplicadas.length > 0 ? ` ${duplicadas.length} descartadas por duplicadas.` : "") +
      "\n"
  );

  const errores = conProblema.filter((r) => !r.validation.ok);
  if (errores.length > 0) {
    secciones.push(`## Errores de validacion (${errores.length})\n`);
    for (const r of errores) {
      secciones.push(`- ${resumenFactura(r)}`);
      for (const err of r.validation.errors) {
        secciones.push(`  - ${err}`);
      }
    }
    secciones.push("");
  }

  const sinPago = conProblema.filter((r) => r.validation.ok && r.match.matchType === "sin_match");
  if (sinPago.length > 0) {
    secciones.push(`## Sin pago encontrado en el extracto (${sinPago.length})\n`);
    for (const r of sinPago) {
      secciones.push(`- ${resumenFactura(r)} — no se encontro un movimiento con ese monto dentro de +-3 dias.`);
    }
    secciones.push("");
  }

  const divididas = rows.filter((r) => r.match.matchType === "dividido");
  if (divididas.length > 0) {
    secciones.push(`## Conciliadas con pago dividido (${divididas.length})\n`);
    for (const r of divididas) {
      const refs = r.match.splitMatches?.map((l) => `${l.referencia} ($${l.monto.toLocaleString("es-CO")})`).join(" + ") ?? "";
      secciones.push(`- ${resumenFactura(r)} — cubierta por ${refs}.`);
    }
    secciones.push("");
  }

  if (duplicadas.length > 0) {
    secciones.push(`## Facturas duplicadas, no contadas dos veces (${duplicadas.length})\n`);
    for (const r of duplicadas) {
      secciones.push(`- ${resumenFactura(r)} — reenvio de una factura ya procesada (${r.sourceFile}).`);
    }
    secciones.push("");
  }

  if (conProblema.length === 0 && divididas.length === 0 && duplicadas.length === 0) {
    secciones.push("Todo concilia. No hay discrepancias que revisar.\n");
  }

  return secciones.join("\n");
}
