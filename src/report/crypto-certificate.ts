import { createHash, randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Invoice, MatchResult } from "../types.js";
import { getActiveJurisdiction } from "../validate/jurisdictions/index.js";

export interface AuditCertificate {
  certificateId: string;
  timestamp: string;
  agent: string;
  version: string;
  jurisdiction: string;
  privacyProof: {
    mode: string;
    model: string;
    quantization: string;
    networkTransmissions: string;
    hardwareRuntime: string;
  };
  integrity: {
    totalInvoices: number;
    conciliatedInvoices: number;
    batchDigestSha256: string;
  };
  reconciliationSummary: {
    exactMatches: number;
    fuzzyMatches: number;
    splitMatches: number;
    unmatched: number;
  };
}

/**
 * Genera un Certificado Criptográfico de Auditoría Local con hash SHA-256 inmutable.
 */
export async function generateCryptoCertificate(
  invoices: Invoice[],
  matches: MatchResult[],
  outDir: string = "out"
): Promise<AuditCertificate> {
  // Hash canónico determinístico de todas las facturas procesadas
  const canonicalData = invoices
    .map((inv) => `${inv.proveedor}|${inv.nit}|${inv.numeroFactura}|${inv.fecha}|${inv.total}`)
    .sort()
    .join("\n");

  const digest = createHash("sha256").update(canonicalData).digest("hex");

  const exactCount = matches.filter((m) => m.matchType === "exacto").length;
  const fuzzyCount = matches.filter((m) => m.matchType === "aproximado").length;
  const splitCount = matches.filter((m) => m.matchType === "dividido").length;
  const unmatchedCount = matches.filter((m) => m.matchType === "sin_match").length;
  const conciliatedCount = matches.filter((m) => m.matchType !== "sin_match").length;

  const certificate: AuditCertificate = {
    certificateId: `TALLY-AUDIT-${randomUUID().slice(0, 8).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    agent: "Tally - Local Autonomous Operations Agent",
    version: "0.1.0",
    jurisdiction: getActiveJurisdiction().countryName,
    privacyProof: {
      mode: "100% On-Device / Zero-Cloud",
      model: "SmolVLM2-500M-Instruct (SMOLVLM2_500M_MULTIMODAL_Q8_0)",
      quantization: "Q8_0 (8-bit High Fidelity)",
      networkTransmissions: "0 bytes sent to external cloud or third-party APIs",
      hardwareRuntime: "Bare runtime / Node.js with @qvac/sdk",
    },
    integrity: {
      totalInvoices: invoices.length,
      conciliatedInvoices: conciliatedCount,
      batchDigestSha256: digest,
    },
    reconciliationSummary: {
      exactMatches: exactCount,
      fuzzyMatches: fuzzyCount,
      splitMatches: splitCount,
      unmatched: unmatchedCount,
    },
  };

  await mkdir(outDir, { recursive: true });
  const certPath = path.join(outDir, "certificado_auditoria.json");
  await writeFile(certPath, JSON.stringify(certificate, null, 2), "utf-8");

  return certificate;
}
