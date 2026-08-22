import type { Invoice, MatchResult, ValidationResult } from "../types.js";
import { calculateConfidence, type ConfidenceBreakdown } from "../validate/confidence.js";

export interface Reconciled {
  sourceFile: string;
  invoice: Invoice;
  validation: ValidationResult;
  match: MatchResult;
  confidence?: ConfidenceBreakdown;
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
  "confianza",
  "nivelConfianza",
  "errores",
  "conciliacion",
  "referenciaPago",
];

export function buildLibroComprasCsv(rows: Reconciled[]): string {
  const lines = rows.map((r) => {
    const conf = r.confidence ?? calculateConfidence(r.invoice, r.validation, r.match);
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
      `${conf.percentage}%`,
      conf.level,
      r.validation.errors.join(" | "),
      r.match.matchType,
      r.match.match?.referencia ?? r.match.splitMatches?.map((l) => l.referencia).join(" + ") ?? "",
    ];
    return cols.map(csvEscape).join(",");
  });
  return [LIBRO_HEADERS.join(","), ...lines].join("\n") + "\n";
}

function resumenFactura(r: Reconciled): string {
  const conf = r.confidence ?? calculateConfidence(r.invoice, r.validation, r.match);
  return `**${r.invoice.numeroFactura ?? "(sin número)"}** — ${r.invoice.proveedor} — ${r.invoice.fecha} — $${r.invoice.total.toLocaleString("es-CO")} [Confianza: ${conf.percentage}% - ${conf.level.toUpperCase()}]`;
}

function accionRecomendada(r: Reconciled, tipo: "error_aritm" | "nit_invalido" | "sin_pago" | "duplicado"): string {
  switch (tipo) {
    case "error_aritm":
      return `⚡ **Acción en 5s**: Solicitar refacturación al proveedor o revisar si hubo un descuento comercial no desglosado.`;
    case "nit_invalido":
      return `⚡ **Acción en 5s**: Verificar RUT del proveedor en el portal DIAN para confirmar dígito de verificación.`;
    case "sin_pago":
      return `⚡ **Acción en 5s**: Confirmar con tesorería si el pago está programado para próximo corte o si se pagó desde otra cuenta bancaria.`;
    case "duplicado":
      return `⚡ **Acción en 5s**: Descartar registro duplicado para evitar doble contabilización o doble pago.`;
  }
}

export function buildDiscrepanciasMd(rows: Reconciled[], duplicadas: Reconciled[] = []): string {
  const conProblema = rows.filter((r) => !r.validation.ok || r.match.matchType === "sin_match");
  const sinProblema = rows.length - conProblema.length;

  const secciones: string[] = [];
  secciones.push(`# Reporte de Discrepancias y Auditoría Operativa\n`);
  secciones.push(
    `> **Resumen Ejecutivo**: ${rows.length} facturas procesadas. **${sinProblema} sin problemas** (conciliación automática lista). **${conProblema.length} requieren revisión humana**.` +
      (duplicadas.length > 0 ? ` **${duplicadas.length} duplicadas descartadas** automáticamente.` : "") +
      "\n"
  );

  const erroresAritm = conProblema.filter((r) => r.validation.errors.some((e) => e.toLowerCase().includes("aritmet") || e.toLowerCase().includes("descuadre")));
  const erroresNit = conProblema.filter((r) => r.validation.errors.some((e) => e.toLowerCase().includes("nit") || e.toLowerCase().includes("digito")));

  if (erroresAritm.length > 0) {
    secciones.push(`## 🔴 CRÍTICO: Descuadres Aritméticos (${erroresAritm.length})\n`);
    for (const r of erroresAritm) {
      secciones.push(`- ${resumenFactura(r)}`);
      for (const err of r.validation.errors.filter((e) => e.toLowerCase().includes("aritmet") || e.toLowerCase().includes("descuadre"))) {
        secciones.push(`  - ⚠️ *${err}*`);
      }
      secciones.push(`  - ${accionRecomendada(r, "error_aritm")}\n`);
    }
  }

  if (erroresNit.length > 0) {
    secciones.push(`## 🟡 ADVERTENCIA: Inconsistencia en NIT / Régimen (${erroresNit.length})\n`);
    for (const r of erroresNit) {
      secciones.push(`- ${resumenFactura(r)}`);
      for (const err of r.validation.errors.filter((e) => e.toLowerCase().includes("nit") || e.toLowerCase().includes("digito"))) {
        secciones.push(`  - ⚠️ *${err}*`);
      }
      secciones.push(`  - ${accionRecomendada(r, "nit_invalido")}\n`);
    }
  }

  const sinPago = conProblema.filter((r) => r.validation.ok && r.match.matchType === "sin_match");
  if (sinPago.length > 0) {
    secciones.push(`## 🔴 CRÍTICO: Facturas sin Pago en Extracto (${sinPago.length})\n`);
    for (const r of sinPago) {
      secciones.push(`- ${resumenFactura(r)} — No se encontró movimiento coincidente dentro de la ventana de ±3 días.`);
      secciones.push(`  - ${accionRecomendada(r, "sin_pago")}\n`);
    }
  }

  const divididas = rows.filter((r) => r.match.matchType === "dividido");
  if (divididas.length > 0) {
    secciones.push(`## 🔵 INFORMATIVO: Conciliadas con Pago Dividido / Multi-Transacción (${divididas.length})\n`);
    for (const r of divididas) {
      const refs = r.match.splitMatches?.map((l) => `${l.referencia} ($${l.monto.toLocaleString("es-CO")})`).join(" + ") ?? "";
      secciones.push(`- ${resumenFactura(r)} — Factura cubierta por suma de 2 transacciones: ${refs}.`);
      secciones.push(`  - 💡 *Conciliación automática exitosa, no requiere intervención.*\n`);
    }
  }

  if (duplicadas.length > 0) {
    secciones.push(`## 🛡️ Detección de Duplicados (${duplicadas.length})\n`);
    for (const r of duplicadas) {
      secciones.push(`- ${resumenFactura(r)} — Reenvío de factura ya registrada previamente (${r.sourceFile}).`);
      secciones.push(`  - ${accionRecomendada(r, "duplicado")}\n`);
    }
  }

  if (conProblema.length === 0 && divididas.length === 0 && duplicadas.length === 0) {
    secciones.push("✅ **Todo concilia al 100%**. No se encontraron discrepancias operativas.\n");
  }

  return secciones.join("\n");
}
