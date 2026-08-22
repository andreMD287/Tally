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

interface Extraida {
  file: string;
  invoice: Invoice;
  repairs?: string[];
}

async function loadFromImages(facturasDir: string): Promise<Extraida[]> {
  const files = (await readdir(facturasDir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const out: Extraida[] = [];
  console.log(`\n🔍 Extrayendo datos de ${files.length} imágenes en ${facturasDir}...`);

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const full = path.join(facturasDir, f);
    process.stdout.write(`  [${i + 1}/${files.length}] ${f}... `);
    const result = await extract(full);

    if (!result.invoice) {
      console.log(`❌ FALLÓ tras ${result.attempts} intento(s): ${result.error ?? "desconocido"}`);
      continue;
    }

    // Auto-corrección aritmética y resiliencia
    const healRes = healInvoice(result.invoice);
    const healMsg = healRes.healed ? ` 🩹 [Auto-Reparado: ${healRes.repairs.length}]` : "";

    console.log(`✅ OK [${result.latencyMs}ms] (${healRes.invoice.proveedor.slice(0, 20)} - $${healRes.invoice.total.toLocaleString("es-CO")})${healMsg}`);
    out.push({ file: f, invoice: healRes.invoice, repairs: healRes.repairs });
  }
  return out;
}

/** Modo prueba: usa el ground truth como si fuera la salida perfecta del modelo, para validar la logica del pipeline sola. */
async function loadFromGroundTruth(gtPath: string): Promise<Extraida[]> {
  console.log(`\n📖 Cargando ground truth desde ${gtPath}...`);
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
Uso:
  npm run cli -- <carpeta-facturas> <extracto.csv> [opciones]

Opciones:
  --ground-truth <archivo.json>   Usa el dataset de ground truth en vez de invocar el modelo VLM
  --qvac                          Usa QVAC con SmolVLM2 localmente para extraer las facturas
  --mock                          Usa el extractor mock (por defecto si no se especifica --qvac)
  --country <CO|AR|MX|GLOBAL>     Define la jurisdicción tributaria (por defecto CO / Colombia DIAN)
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
    console.log("⚡ Motor de extracción: QVAC (SmolVLM2-500M local)");
  } else if (useMock) {
    setExtractor(mockExtract);
    console.log("⚡ Motor de extracción: Mock");
  }

  console.log("==================================================================");
  console.log("  TALLY: Pipeline de Conciliación de Facturas y Extracto Bancario");
  console.log(`  Jurisdicción Activa: ${getActiveJurisdiction().countryName}`);
  console.log("==================================================================");

  const extraidasConDuplicados = groundTruthPath
    ? await loadFromGroundTruth(groundTruthPath)
    : await loadFromImages(facturasDirArg);

  // Paso 1: Deduplicación
  const { unicas: extraidas, duplicadas } = dedupeByInvoiceNumber(extraidasConDuplicados);
  console.log(`\n🧹 Deduplicación:`);
  console.log(`  - Total procesadas: ${extraidasConDuplicados.length}`);
  console.log(`  - Facturas únicas:  ${extraidas.length}`);
  console.log(`  - Duplicadas desc.: ${duplicadas.length}`);

  // Paso 2: Ingesta de Extracto Bancario
  const extractoText = await readFile(extractoCsvArg, "utf-8");
  const extracto = parseExtractoCsv(extractoText);
  console.log(`\n🏦 Extracto Bancario: ${extracto.length} movimientos cargados.`);

  // Paso 3: Conciliación Inteligente (monto, fecha, tolerancia, split match)
  const matches = matchInvoices(
    extraidas.map((e) => e.invoice),
    extracto
  );

  // Paso 4: Validación de Reglas de Negocio
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

  // Paso 5: Generación de Reportes y Certificado Criptográfico
  const outDir = path.resolve("out");
  await mkdir(outDir, { recursive: true });
  const libroComprasPath = path.join(outDir, "libro_compras.csv");
  const discrepanciasPath = path.join(outDir, "discrepancias.md");

  await writeFile(libroComprasPath, buildLibroComprasCsv(reconciled));
  await writeFile(discrepanciasPath, buildDiscrepanciasMd(reconciled, duplicadasReconciled));

  // Generación de Sello Criptográfico SHA-256
  const cert = await generateCryptoCertificate(
    reconciled.map((r) => r.invoice),
    matches,
    outDir
  );

  // Resumen Estadístico
  const ok = reconciled.filter((r) => r.validation.ok).length;
  const exactos = reconciled.filter((r) => r.match.matchType === "exacto").length;
  const aprox = reconciled.filter((r) => r.match.matchType === "aproximado").length;
  const divididos = reconciled.filter((r) => r.match.matchType === "dividido").length;
  const sinMatch = reconciled.filter((r) => r.match.matchType === "sin_match").length;
  const conciliadasTotal = exactos + aprox + divididos;

  console.log("\n==================================================================");
  console.log("  RESUMEN DE EJECUCIÓN");
  console.log("==================================================================");
  console.log(`📋 Validación de Reglas:  ${ok}/${reconciled.length} válidas (${reconciled.length - ok} con observaciones)`);
  console.log(`💰 Conciliación Bancaria: ${conciliadasTotal}/${reconciled.length} conciliadas (${((conciliadasTotal / (reconciled.length || 1)) * 100).toFixed(1)}%)`);
  console.log(`   - Coincidencias exactas:     ${exactos}`);
  console.log(`   - Coincidencias aproximadas: ${aprox}`);
  console.log(`   - Pagos divididos (2 tx):    ${divididos}`);
  console.log(`   - Sin coincidencia bancaria: ${sinMatch}`);
  console.log(`\n🛡️ Sello Criptográfico:  ${cert.certificateId} (SHA-256: ${cert.integrity.batchDigestSha256.slice(0, 16)}...)`);
  console.log(`\n📁 Reportes generados:`);
  console.log(`   1. Libro de Compras:       ${libroComprasPath}`);
  console.log(`   2. Discrepancias:          ${discrepanciasPath}`);
  console.log(`   3. Certificado Cripto:     ${path.join(outDir, "certificado_auditoria.json")}`);
  console.log("==================================================================\n");
}

main().catch((err) => {
  console.error("Error en CLI:", err);
  process.exit(1);
});
