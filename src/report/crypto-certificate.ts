import { createHash, randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Invoice, MatchResult } from "../types.js";
import { getActiveJurisdiction } from "../validate/jurisdictions/index.js";

export interface EngineInfo {
  /** Identifica que extractor genero los datos: es la unica fuente de verdad para privacyProof. */
  source: "qvac" | "mock" | "ground-truth";
  model: string;
  quantization: string;
  hardwareRuntime: string;
}

export const QVAC_ENGINE_INFO: EngineInfo = {
  source: "qvac",
  model: "SmolVLM2-500M-Instruct (SMOLVLM2_500M_MULTIMODAL_Q8_0)",
  quantization: "Q8_0 (8-bit High Fidelity)",
  hardwareRuntime: "Bare runtime / Node.js with @qvac/sdk",
};

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
  outDir: string = "out",
  engine: EngineInfo = { source: "mock", model: "none (mock/ground-truth, no model executed)", quantization: "n/a", hardwareRuntime: "n/a" }
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
      mode:
        engine.source === "qvac"
          ? "100% On-Device / Zero-Cloud (live SmolVLM2 inference via @qvac/sdk)"
          : `NOT a privacy proof of AI inference: extractor was "${engine.source}" — no vision model executed for this run`,
      model: engine.model,
      quantization: engine.quantization,
      networkTransmissions: "0 bytes sent to external cloud or third-party APIs",
      hardwareRuntime: engine.hardwareRuntime,
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
