import { describe, it, expect } from "vitest";
import { generateCryptoCertificate } from "./crypto-certificate.js";
import type { Invoice, MatchResult } from "../types.js";
import os from "node:os";

describe("Cryptographic SHA-256 Audit Certificate", () => {
  const inv1: Invoice = {
    proveedor: "Proveedor A S.A.S.",
    nit: "900111222-3",
    numeroFactura: "FE-100",
    fecha: "2026-08-10",
    subtotal: 100000,
    iva: 19000,
    total: 119000,
  };

  const inv2: Invoice = {
    proveedor: "Proveedor B LTDA",
    nit: "800333444-5",
    numeroFactura: "FE-200",
    fecha: "2026-08-11",
    subtotal: 200000,
    iva: 38000,
    total: 238000,
  };

  const matches: MatchResult[] = [
    { invoice: inv1, match: { fecha: "2026-08-10", monto: 119000, referencia: "TRX-01", contraparte: "Proveedor A S.A.S." }, matchType: "exacto", score: 1.0 },
    { invoice: inv2, match: null, matchType: "sin_match", score: 0 },
  ];

  it("generates a valid certificate with SHA-256 digest and environment specs", async () => {
    const tmpDir = os.tmpdir();
    const cert = await generateCryptoCertificate([inv1, inv2], matches, tmpDir);

    expect(cert.certificateId).toMatch(/^TALLY-AUDIT-[A-F0-9]{8}$/);
    expect(cert.integrity.batchDigestSha256).toHaveLength(64);
    expect(cert.integrity.totalInvoices).toBe(2);
    expect(cert.integrity.conciliatedInvoices).toBe(1);
    expect(cert.privacyProof.model).toContain("SmolVLM2-500M");
    expect(cert.privacyProof.networkTransmissions).toContain("0 bytes");
  });

  it("computes deterministic hash for identical invoice datasets", async () => {
    const tmpDir = os.tmpdir();
    const certA = await generateCryptoCertificate([inv1, inv2], matches, tmpDir);
    const certB = await generateCryptoCertificate([inv1, inv2], matches, tmpDir);

    expect(certA.integrity.batchDigestSha256).toBe(certB.integrity.batchDigestSha256);
  });
});
