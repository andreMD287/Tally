import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { qvacExtract } from "../src/extract/qvac.js";
import { mockExtract } from "../src/extract/mock.js";
import type { ExtractFn, ExtractResult, Invoice } from "../src/types.js";

interface GroundTruthItem {
  file: string;
  issue: string | null;
  degraded: boolean;
  canMatch: boolean;
  invoice: Invoice;
}

interface FieldAccuracy {
  total: number;
  correct: number;
}

interface BenchmarkStats {
  totalInvoices: number;
  extractedCount: number;
  failedCount: number;
  cleanTotal: number;
  cleanCorrectAll: number;
  degradedTotal: number;
  degradedCorrectAll: number;
  latencies: number[];
  fields: {
    proveedor: FieldAccuracy;
    nit: FieldAccuracy;
    numeroFactura: FieldAccuracy;
    fecha: FieldAccuracy;
    subtotal: FieldAccuracy;
    iva: FieldAccuracy;
    total: FieldAccuracy;
  };
}

function initStats(): BenchmarkStats {
  return {
    totalInvoices: 0,
    extractedCount: 0,
    failedCount: 0,
    cleanTotal: 0,
    cleanCorrectAll: 0,
    degradedTotal: 0,
    degradedCorrectAll: 0,
    latencies: [],
    fields: {
      proveedor: { total: 0, correct: 0 },
      nit: { total: 0, correct: 0 },
      numeroFactura: { total: 0, correct: 0 },
      fecha: { total: 0, correct: 0 },
      subtotal: { total: 0, correct: 0 },
      iva: { total: 0, correct: 0 },
      total: { total: 0, correct: 0 },
    },
  };
}

function isNumberClose(a: number, b: number, tolerance = 2): boolean {
  return Math.abs(a - b) <= tolerance;
}

function normalizeStr(s: string | null | undefined): string {
  if (!s) return "";
  return s.trim().toLowerCase().replace(/[\s\-_.]/g, "");
}

async function runBenchmark() {
  const args = process.argv.slice(2);
  const useQvac = args.includes("--qvac");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;

  const extractor: ExtractFn = useQvac ? qvacExtract : mockExtract;
  console.log(`\n======================================================`);
  console.log(`  TALLY BENCHMARK: VLM / OCR Extraction Evaluation`);
  console.log(`  Extractor: ${useQvac ? "QVAC (SmolVLM2-500M)" : "Mock (Ground-Truth Baseline)"}`);
  console.log(`======================================================\n`);

  const gtPath = path.resolve("data", "ground_truth.json");
  const gtRaw = await readFile(gtPath, "utf-8");
  let groundTruth: GroundTruthItem[] = JSON.parse(gtRaw);

  if (limit && limit > 0) {
    groundTruth = groundTruth.slice(0, limit);
    console.log(`[INFO] Evaluating limited subset of ${limit} invoices.\n`);
  }

  const stats = initStats();
  stats.totalInvoices = groundTruth.length;

  const facturasDir = path.resolve("data", "facturas");

  for (let i = 0; i < groundTruth.length; i++) {
    const item = groundTruth[i];
    const imagePath = path.join(facturasDir, item.file);

    process.stdout.write(`[${i + 1}/${groundTruth.length}] Evaluating ${item.file}... `);

    const result: ExtractResult = await extractor(imagePath);
    stats.latencies.push(result.latencyMs);

    if (item.degraded) {
      stats.degradedTotal++;
    } else {
      stats.cleanTotal++;
    }

    if (!result.invoice) {
      stats.failedCount++;
      console.log(`[ERROR] (${result.error ?? "Parse failure"}) [${result.latencyMs}ms]`);
      continue;
    }

    stats.extractedCount++;

    const inv = result.invoice;
    const gt = item.invoice;

    const matchProveedor = normalizeStr(inv.proveedor).includes(normalizeStr(gt.proveedor)) ||
      normalizeStr(gt.proveedor).includes(normalizeStr(inv.proveedor));
    const matchNit = normalizeStr(inv.nit) === normalizeStr(gt.nit);
    const matchNum = normalizeStr(inv.numeroFactura) === normalizeStr(gt.numeroFactura);
    const matchFecha = inv.fecha === gt.fecha;
    const matchSubtotal = isNumberClose(inv.subtotal, gt.subtotal);
    const matchIva = isNumberClose(inv.iva, gt.iva);
    const matchTotal = isNumberClose(inv.total, gt.total);

    stats.fields.proveedor.total++;
    if (matchProveedor) stats.fields.proveedor.correct++;

    stats.fields.nit.total++;
    if (matchNit) stats.fields.nit.correct++;

    stats.fields.numeroFactura.total++;
    if (matchNum) stats.fields.numeroFactura.correct++;

    stats.fields.fecha.total++;
    if (matchFecha) stats.fields.fecha.correct++;

    stats.fields.subtotal.total++;
    if (matchSubtotal) stats.fields.subtotal.correct++;

    stats.fields.iva.total++;
    if (matchIva) stats.fields.iva.correct++;

    stats.fields.total.total++;
    if (matchTotal) stats.fields.total.correct++;

    const allCorrect = matchProveedor && matchNit && matchNum && matchFecha && matchSubtotal && matchIva && matchTotal;

    if (allCorrect) {
      if (item.degraded) stats.degradedCorrectAll++;
      else stats.cleanCorrectAll++;
      console.log(`[OK] (100% exact) [${result.latencyMs}ms]`);
    } else {
      console.log(`[PARTIAL] [${result.latencyMs}ms]`);
    }
  }

  const avgLatency = Math.round(stats.latencies.reduce((a, b) => a + b, 0) / (stats.latencies.length || 1));
  const sortedLatencies = [...stats.latencies].sort((a, b) => a - b);
  const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ?? 0;
  const minLatency = sortedLatencies[0] ?? 0;
  const maxLatency = sortedLatencies[sortedLatencies.length - 1] ?? 0;

  const pct = (correct: number, total: number) => total > 0 ? ((correct / total) * 100).toFixed(1) : "0.0";

  console.log(`\n======================================================`);
  console.log(`  BENCHMARK SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total Invoices Evaluated: ${stats.totalInvoices}`);
  console.log(`Successful JSON Parsing:  ${stats.extractedCount}/${stats.totalInvoices} (${pct(stats.extractedCount, stats.totalInvoices)}%)`);
  console.log(`Mean Latency:             ${avgLatency} ms (Min: ${minLatency}ms, Max: ${maxLatency}ms, P95: ${p95Latency}ms)`);
  console.log(`\n--- Accuracy by Field ---`);
  console.log(`- Supplier:       ${pct(stats.fields.proveedor.correct, stats.fields.proveedor.total)}% (${stats.fields.proveedor.correct}/${stats.fields.proveedor.total})`);
  console.log(`- Tax ID:         ${pct(stats.fields.nit.correct, stats.fields.nit.total)}% (${stats.fields.nit.correct}/${stats.fields.nit.total})`);
  console.log(`- Invoice Number: ${pct(stats.fields.numeroFactura.correct, stats.fields.numeroFactura.total)}% (${stats.fields.numeroFactura.correct}/${stats.fields.numeroFactura.total})`);
  console.log(`- Date:           ${pct(stats.fields.fecha.correct, stats.fields.fecha.total)}% (${stats.fields.fecha.correct}/${stats.fields.fecha.total})`);
  console.log(`- Subtotal:       ${pct(stats.fields.subtotal.correct, stats.fields.subtotal.total)}% (${stats.fields.subtotal.correct}/${stats.fields.subtotal.total})`);
  console.log(`- VAT:            ${pct(stats.fields.iva.correct, stats.fields.iva.total)}% (${stats.fields.iva.correct}/${stats.fields.iva.total})`);
  console.log(`- Total:          ${pct(stats.fields.total.correct, stats.fields.total.total)}% (${stats.fields.total.correct}/${stats.fields.total.total})`);
  console.log(`\n--- Robustness Breakdown ---`);
  console.log(`- Clean Invoices:     ${pct(stats.cleanCorrectAll, stats.cleanTotal)}% perfect (${stats.cleanCorrectAll}/${stats.cleanTotal})`);
  console.log(`- Degraded Invoices:  ${pct(stats.degradedCorrectAll, stats.degradedTotal)}% perfect (${stats.degradedCorrectAll}/${stats.degradedTotal})`);

  const reportMd = `# Benchmark Results: Tally

**Date**: ${new Date().toISOString().split("T")[0]}
**Extraction Engine**: ${useQvac ? "QVAC (SmolVLM2-500M Multimodal Q8_0)" : "Mock (Baseline)"}

## Global Metrics

| Metric | Value |
| :--- | :--- |
| Total Invoices | ${stats.totalInvoices} |
| JSON Parsing Rate | ${pct(stats.extractedCount, stats.totalInvoices)}% (${stats.extractedCount}/${stats.totalInvoices}) |
| Mean Latency | ${avgLatency} ms |
| P95 Latency | ${p95Latency} ms |
| Latency Range | ${minLatency} ms - ${maxLatency} ms |

## Field Precision

| Field | Matches | Accuracy |
| :--- | :--- | :--- |
| Supplier | ${stats.fields.proveedor.correct}/${stats.fields.proveedor.total} | ${pct(stats.fields.proveedor.correct, stats.fields.proveedor.total)}% |
| Tax ID | ${stats.fields.nit.correct}/${stats.fields.nit.total} | ${pct(stats.fields.nit.correct, stats.fields.nit.total)}% |
| Invoice Number | ${stats.fields.numeroFactura.correct}/${stats.fields.numeroFactura.total} | ${pct(stats.fields.numeroFactura.correct, stats.fields.numeroFactura.total)}% |
| Date | ${stats.fields.fecha.correct}/${stats.fields.fecha.total} | ${pct(stats.fields.fecha.correct, stats.fields.fecha.total)}% |
| Subtotal (+-2) | ${stats.fields.subtotal.correct}/${stats.fields.subtotal.total} | ${pct(stats.fields.subtotal.correct, stats.fields.subtotal.total)}% |
| VAT (+-2) | ${stats.fields.iva.correct}/${stats.fields.iva.total} | ${pct(stats.fields.iva.correct, stats.fields.iva.total)}% |
| Total (+-2) | ${stats.fields.total.correct}/${stats.fields.total.total} | ${pct(stats.fields.total.correct, stats.fields.total.total)}% |

## Performance by Image Quality

- **Clean Invoices (70% of dataset)**: ${pct(stats.cleanCorrectAll, stats.cleanTotal)}% precision (${stats.cleanCorrectAll}/${stats.cleanTotal})
- **Degraded Invoices (30% with noise/shadow/rotation)**: ${pct(stats.degradedCorrectAll, stats.degradedTotal)}% precision (${stats.degradedCorrectAll}/${stats.degradedTotal})
`;

  const outDir = path.resolve("out");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "benchmark_results.md"), reportMd);
  console.log(`\nReport saved to: out/benchmark_results.md\n`);
}

runBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
