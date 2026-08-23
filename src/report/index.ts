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
  "file",
  "invoiceNumber",
  "supplier",
  "taxId",
  "date",
  "subtotal",
  "vat",
  "total",
  "validation",
  "confidence",
  "confidenceLevel",
  "errors",
  "reconciliation",
  "paymentReference",
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

function summarizeInvoice(r: Reconciled): string {
  const conf = r.confidence ?? calculateConfidence(r.invoice, r.validation, r.match);
  return `**${r.invoice.numeroFactura ?? "(no number)"}** : ${r.invoice.proveedor} : ${r.invoice.fecha} : $${r.invoice.total.toLocaleString("en-US")} [Confidence: ${conf.percentage}% - ${conf.level.toUpperCase()}]`;
}

function getRecommendedAction(r: Reconciled, type: "arithmetic_error" | "tax_id_invalid" | "unpaid" | "duplicate"): string {
  switch (type) {
    case "arithmetic_error":
      return `**5-Second Action**: Request revised invoice from supplier or verify unitemized commercial discount.`;
    case "tax_id_invalid":
      return `**5-Second Action**: Verify supplier registration in tax authority portal to confirm checksum digit.`;
    case "unpaid":
      return `**5-Second Action**: Confirm with treasury if disbursement is scheduled for next cycle or paid from another account.`;
    case "duplicate":
      return `**5-Second Action**: Discard duplicate record to prevent double entry or duplicate disbursement.`;
  }
}

export function buildDiscrepanciasMd(rows: Reconciled[], duplicadas: Reconciled[] = []): string {
  const withIssues = rows.filter((r) => !r.validation.ok || r.match.matchType === "sin_match");
  const withoutIssues = rows.length - withIssues.length;

  const sections: string[] = [];
  sections.push(`# Operational Discrepancy & Reconciliation Audit Report\n`);
  sections.push(
    `> **Executive Summary**: ${rows.length} invoices processed. **${withoutIssues} clean** (automated reconciliation completed). **${withIssues.length} require human review**.` +
      (duplicadas.length > 0 ? ` **${duplicadas.length} duplicates discarded** automatically.` : "") +
      "\n"
  );

  const arithmeticErrors = withIssues.filter((r) => r.validation.errors.some((e) => e.toLowerCase().includes("aritmet") || e.toLowerCase().includes("descuadre") || e.toLowerCase().includes("arithmetic") || e.toLowerCase().includes("mismatch")));
  const taxIdErrors = withIssues.filter((r) => r.validation.errors.some((e) => e.toLowerCase().includes("nit") || e.toLowerCase().includes("cuit") || e.toLowerCase().includes("rfc") || e.toLowerCase().includes("digito") || e.toLowerCase().includes("tax")));

  if (arithmeticErrors.length > 0) {
    sections.push(`## CRITICAL: Arithmetic Mismatches (${arithmeticErrors.length})\n`);
    for (const r of arithmeticErrors) {
      sections.push(`- ${summarizeInvoice(r)}`);
      for (const err of r.validation.errors.filter((e) => e.toLowerCase().includes("aritmet") || e.toLowerCase().includes("descuadre") || e.toLowerCase().includes("arithmetic") || e.toLowerCase().includes("mismatch"))) {
        sections.push(`  - *${err}*`);
      }
      sections.push(`  - ${getRecommendedAction(r, "arithmetic_error")}\n`);
    }
  }

  if (taxIdErrors.length > 0) {
    sections.push(`## WARNING: Tax ID / Checksum Inconsistencies (${taxIdErrors.length})\n`);
    for (const r of taxIdErrors) {
      sections.push(`- ${summarizeInvoice(r)}`);
      for (const err of r.validation.errors.filter((e) => e.toLowerCase().includes("nit") || e.toLowerCase().includes("cuit") || e.toLowerCase().includes("rfc") || e.toLowerCase().includes("digito") || e.toLowerCase().includes("tax"))) {
        sections.push(`  - *${err}*`);
      }
      sections.push(`  - ${getRecommendedAction(r, "tax_id_invalid")}\n`);
    }
  }

  const unpaid = withIssues.filter((r) => r.validation.ok && r.match.matchType === "sin_match");
  if (unpaid.length > 0) {
    sections.push(`## CRITICAL: Invoices Missing Bank Payment (${unpaid.length})\n`);
    for (const r of unpaid) {
      sections.push(`- ${summarizeInvoice(r)} : No matching bank transaction found within +-3 day window.`);
      sections.push(`  - ${getRecommendedAction(r, "unpaid")}\n`);
    }
  }

  const splitMatches = rows.filter((r) => r.match.matchType === "dividido");
  if (splitMatches.length > 0) {
    sections.push(`## INFO: Reconciled via Split Payment / Multi-Transaction (${splitMatches.length})\n`);
    for (const r of splitMatches) {
      const refs = r.match.splitMatches?.map((l) => `${l.referencia} ($${l.monto.toLocaleString("en-US")})`).join(" + ") ?? "";
      sections.push(`- ${summarizeInvoice(r)} : Total covered by sum of 2 bank transactions: ${refs}.`);
      sections.push(`  - *Automated reconciliation successful, zero manual intervention required.*\n`);
    }
  }

  if (duplicadas.length > 0) {
    sections.push(`## Duplicate Detection (${duplicadas.length})\n`);
    for (const r of duplicadas) {
      sections.push(`- ${summarizeInvoice(r)} : Resubmission of invoice previously recorded (${r.sourceFile}).`);
      sections.push(`  - ${getRecommendedAction(r, "duplicate")}\n`);
    }
  }

  if (withIssues.length === 0 && splitMatches.length === 0 && duplicadas.length === 0) {
    sections.push("**All records reconciled at 100%**. Zero operational discrepancies detected.\n");
  }

  return sections.join("\n");
}
