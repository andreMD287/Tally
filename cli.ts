import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extract, setExtractor, mockExtract, qvacExtract } from "./src/extract/index.js";
import { validate, setJurisdiction, getActiveJurisdiction } from "./src/validate/index.js";
import { healInvoice } from "./src/validate/heal.js";
import { matchInvoices } from "./src/match/index.js";
import { parseExtractoCsv } from "./src/ingest/extracto.js";
import { dedupeByInvoiceNumber } from "./src/ingest/dedupe.js";
import { buildLibroComprasCsv, buildDiscrepanciasMd, type Reconciled } from "./src/report/index.js";
import { generateCryptoCertificate } from "./src/report/crypto-certificate.js";
import type { Invoice } from "./src/types.js";

interface ExtractedItem {
  file: string;
  invoice: Invoice;
  repairs?: string[];
}

async function loadFromImages(facturasDir: string): Promise<ExtractedItem[]> {
  const files = (await readdir(facturasDir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const out: ExtractedItem[] = [];
  console.log(`\nExtracting data from ${files.length} document images in ${facturasDir}...`);

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const full = path.join(facturasDir, f);
    process.stdout.write(`  [${i + 1}/${files.length}] ${f}... `);
    const result = await extract(full);

    if (!result.invoice) {
      console.log(`FAILED after ${result.attempts} attempt(s): ${result.error ?? "unknown error"}`);
      continue;
    }

    const healRes = healInvoice(result.invoice);
    const healMsg = healRes.healed ? ` [Auto-Repaired: ${healRes.repairs.length}]` : "";

    console.log(`OK [${result.latencyMs}ms] (${healRes.invoice.proveedor.slice(0, 20)} - $${healRes.invoice.total.toLocaleString("en-US")})${healMsg}`);
    out.push({ file: f, invoice: healRes.invoice, repairs: healRes.repairs });
  }
  return out;
}

async function loadFromGroundTruth(gtPath: string): Promise<ExtractedItem[]> {
  console.log(`\nLoading ground truth dataset from ${gtPath}...`);
  const raw = JSON.parse(await readFile(gtPath, "utf-8")) as { file: string; invoice: Invoice }[];
  return raw.map((e) => {
    const healRes = healInvoice(e.invoice);
    return { file: e.file, invoice: healRes.invoice, repairs: healRes.repairs };
  });
}

async function main() {
  const [, , facturasDirArg, extractoCsvArg, ...rest] = process.argv;
  if (!facturasDirArg || !extractoCsvArg) {
    console.log(`
Usage:
  npm run cli -- <invoices-dir> <bank-statement.csv> [options]

Options:
  --ground-truth <file.json>   Use ground-truth dataset instead of calling VLM model
  --qvac                       Use local QVAC SmolVLM2 model for multimodal extraction
  --mock                       Use mock extractor (default if --qvac is not specified)
  --country <CO|AR|MX|GLOBAL>  Select tax jurisdiction (default: CO / Colombia DIAN)
    `);
    process.exit(1);
  }

  const useQvac = rest.includes("--qvac");
  const useMock = rest.includes("--mock");
  const gtFlagIdx = rest.indexOf("--ground-truth");
  const groundTruthPath = gtFlagIdx !== -1 ? rest[gtFlagIdx + 1] : null;

  const countryFlagIdx = rest.indexOf("--country");
  if (countryFlagIdx !== -1 && rest[countryFlagIdx + 1]) {
    setJurisdiction(rest[countryFlagIdx + 1]);
  }

  if (useQvac) {
    setExtractor(qvacExtract);
    console.log("Extraction Engine: QVAC (SmolVLM2-500M Local)");
  } else if (useMock) {
    setExtractor(mockExtract);
    console.log("Extraction Engine: Mock / Deterministic");
  }

  console.log("==================================================================");
  console.log("  TALLY: Local Autonomous Invoice & Bank Reconciliation Pipeline");
  console.log(`  Active Jurisdiction: ${getActiveJurisdiction().countryName}`);
  console.log("==================================================================");

  const extraidasConDuplicados = groundTruthPath
    ? await loadFromGroundTruth(groundTruthPath)
    : await loadFromImages(facturasDirArg);

  // Step 1: Deduplication
  const { unicas: extraidas, duplicadas } = dedupeByInvoiceNumber(extraidasConDuplicados);
  console.log(`\nDeduplication:`);
  console.log(`  - Total Processed:   ${extraidasConDuplicados.length}`);
  console.log(`  - Unique Invoices:   ${extraidas.length}`);
  console.log(`  - Duplicates Found:  ${duplicadas.length}`);

  // Step 2: Bank Statement Ingestion
  const extractoText = await readFile(extractoCsvArg, "utf-8");
  const extracto = parseExtractoCsv(extractoText);
  console.log(`\nBank Statement: ${extracto.length} transactions loaded.`);

  // Step 3: Bank Reconciliation
  const matches = matchInvoices(
    extraidas.map((e) => e.invoice),
    extracto
  );

  // Step 4: Tax & Business Rule Validation
  const reconciled: Reconciled[] = extraidas.map((e, i) => ({
    sourceFile: e.file,
    invoice: e.invoice,
    validation: validate(e.invoice),
    match: matches[i],
  }));

  const duplicadasReconciled: Reconciled[] = duplicadas.map((e) => ({
    sourceFile: e.file,
    invoice: e.invoice,
    validation: { ok: true, errors: [] },
    match: { invoice: e.invoice, match: null, matchType: "sin_match", score: 0 },
  }));

  // Step 5: Report Generation & Cryptographic Seal
  const outDir = path.resolve("out");
  await mkdir(outDir, { recursive: true });
  const libroComprasPath = path.join(outDir, "libro_compras.csv");
  const discrepanciasPath = path.join(outDir, "discrepancias.md");

  await writeFile(libroComprasPath, buildLibroComprasCsv(reconciled));
  await writeFile(discrepanciasPath, buildDiscrepanciasMd(reconciled, duplicadasReconciled));

  const cert = await generateCryptoCertificate(
    reconciled.map((r) => r.invoice),
    matches,
    outDir
  );

  const ok = reconciled.filter((r) => r.validation.ok).length;
  const exactos = reconciled.filter((r) => r.match.matchType === "exacto").length;
  const aprox = reconciled.filter((r) => r.match.matchType === "aproximado").length;
  const divididos = reconciled.filter((r) => r.match.matchType === "dividido").length;
  const sinMatch = reconciled.filter((r) => r.match.matchType === "sin_match").length;
  const conciliadasTotal = exactos + aprox + divididos;

  console.log("\n==================================================================");
  console.log("  EXECUTION SUMMARY");
  console.log("==================================================================");
  console.log(`Tax Rule Validation:  ${ok}/${reconciled.length} valid (${reconciled.length - ok} exceptions flagged)`);
  console.log(`Bank Reconciliation:  ${conciliadasTotal}/${reconciled.length} reconciled (${((conciliadasTotal / (reconciled.length || 1)) * 100).toFixed(1)}%)`);
  console.log(`   - Exact 1:1 Matches:      ${exactos}`);
  console.log(`   - Approximate Matches:    ${aprox}`);
  console.log(`   - Split-Payment Pairs:    ${divididos}`);
  console.log(`   - Unreconciled / Pending: ${sinMatch}`);
  console.log(`\nCryptographic Seal:   ${cert.certificateId} (SHA-256: ${cert.integrity.batchDigestSha256.slice(0, 16)}...)`);
  console.log(`\nGenerated Artifacts:`);
  console.log(`   1. Purchase Ledger:       ${libroComprasPath}`);
  console.log(`   2. Discrepancy Triage:    ${discrepanciasPath}`);
  console.log(`   3. Crypto Audit Proof:    ${path.join(outDir, "certificado_auditoria.json")}`);
  console.log("==================================================================\n");
}

main().catch((err) => {
  console.error("CLI Error:", err);
  process.exit(1);
});
