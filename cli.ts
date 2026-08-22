import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extract } from "./src/extract/index.js";
import { validate } from "./src/validate/index.js";
import { matchInvoices } from "./src/match/index.js";
import { parseExtractoCsv } from "./src/ingest/extracto.js";
import { dedupeByInvoiceNumber } from "./src/ingest/dedupe.js";
import { buildLibroComprasCsv, buildDiscrepanciasMd, type Reconciled } from "./src/report/index.js";
import type { Invoice } from "./src/types.js";

interface Extraida {
  file: string;
  invoice: Invoice;
}

async function loadFromImages(facturasDir: string): Promise<Extraida[]> {
  const files = (await readdir(facturasDir)).filter((f) => /\.(png|jpe?g)$/i.test(f));
  const out: Extraida[] = [];
  for (const f of files) {
    const full = path.join(facturasDir, f);
    const result = await extract(full);
    if (!result.invoice) {
      console.warn(`  [WARN] no se pudo extraer ${f} tras ${result.attempts} intento(s): ${result.error ?? "sin detalle"}`);
      continue;
    }
    out.push({ file: f, invoice: result.invoice });
  }
  return out;
}

/** Modo prueba: usa el ground truth como si fuera la salida perfecta del modelo, para validar la logica del pipeline sola. */
async function loadFromGroundTruth(gtPath: string): Promise<Extraida[]> {
  const raw = JSON.parse(await readFile(gtPath, "utf-8")) as { file: string; invoice: Invoice }[];
  return raw.map((e) => ({ file: e.file, invoice: e.invoice }));
}

async function main() {
  const [, , facturasDirArg, extractoCsvArg, ...rest] = process.argv;
  if (!facturasDirArg || !extractoCsvArg) {
    console.error("Uso: npm run cli -- <carpeta-facturas> <extracto.csv> [--ground-truth <archivo.json>]");
    process.exit(1);
  }

  const gtFlagIdx = rest.indexOf("--ground-truth");
  const groundTruthPath = gtFlagIdx !== -1 ? rest[gtFlagIdx + 1] : null;

  const extraidasConDuplicados = groundTruthPath
    ? await loadFromGroundTruth(groundTruthPath)
    : await loadFromImages(facturasDirArg);

  const { unicas: extraidas, duplicadas } = dedupeByInvoiceNumber(extraidasConDuplicados);
  console.log(`Facturas cargadas: ${extraidasConDuplicados.length} (${duplicadas.length} duplicadas descartadas)`);

  const extractoText = await readFile(extractoCsvArg, "utf-8");
  const extracto = parseExtractoCsv(extractoText);
  console.log(`Lineas de extracto: ${extracto.length}`);

  const matches = matchInvoices(
    extraidas.map((e) => e.invoice),
    extracto
  );

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

  const outDir = path.resolve("out");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "libro_compras.csv"), buildLibroComprasCsv(reconciled));
  await writeFile(path.join(outDir, "discrepancias.md"), buildDiscrepanciasMd(reconciled, duplicadasReconciled));

  const ok = reconciled.filter((r) => r.validation.ok).length;
  const conciliadas = reconciled.filter((r) => r.match.matchType !== "sin_match").length;
  const divididas = reconciled.filter((r) => r.match.matchType === "dividido").length;
  console.log(`Validacion OK: ${ok}/${reconciled.length}`);
  console.log(`Conciliadas: ${conciliadas}/${reconciled.length} (${divididas} con pago dividido)`);
  console.log(`Salida: out/libro_compras.csv, out/discrepancias.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
