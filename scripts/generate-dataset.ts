import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Invoice } from "../src/types.js";
import { formatNit, nitCheckDigit } from "../src/nit.js";
import { makeRng } from "./lib/rng.js";
import { NOMBRES_BASE, FORMAS_JURIDICAS, CIUDADES, DESCRIPCIONES_ITEM } from "./lib/pools.js";
import { renderInvoiceSvg, type LineItem } from "./lib/svg-templates.js";
import { degrade } from "./lib/degrade.js";

const SEED = 42;
const N = 40;
const OUT_DIR = path.resolve("data");
const FACTURAS_DIR = path.join(OUT_DIR, "facturas");

const rng = makeRng(SEED);

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function randomFechaAgosto2026(): string {
  const day = rng.int(1, 20);
  return `2026-08-${String(day).padStart(2, "0")}`;
}

function splitIntoItems(subtotal: number): LineItem[] {
  const count = rng.int(2, 4);
  const weights = Array.from({ length: count }, () => rng.float() + 0.2);
  const wsum = weights.reduce((a, b) => a + b, 0);
  const items: LineItem[] = [];
  let running = 0;
  for (let idx = 0; idx < count; idx++) {
    const isLast = idx === count - 1;
    const raw = isLast ? subtotal - running : Math.round((weights[idx] / wsum) * subtotal);
    const cantidad = rng.int(1, 6);
    const precioUnitario = Math.max(1, Math.round(raw / cantidad));
    const total = precioUnitario * cantidad;
    running += total;
    items.push({ descripcion: rng.pick(DESCRIPCIONES_ITEM), cantidad, precioUnitario, total });
  }
  const sum = items.reduce((s, it) => s + it.total, 0);
  const diff = subtotal - sum;
  if (diff !== 0) {
    const last = items[items.length - 1];
    last.total += diff;
    last.cantidad = 1;
    last.precioUnitario = last.total;
  }
  return items;
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]/g, "_");
}

interface GtEntry {
  file: string;
  invoice: Invoice;
  meta: {
    designIndex: number;
    degraded: boolean;
    issue: "nit_invalido" | "descuadre_menor" | "descuadre_grande" | null;
  };
}

interface ExtractoLineaOut {
  fecha: string;
  monto: number;
  contraparte: string;
  referencia: string;
}

function nombreParaExtracto(proveedor: string): string {
  const variant = rng.pick(["mayus", "sin_forma", "compacto", "tal_cual"] as const);
  switch (variant) {
    case "mayus":
      return proveedor.toUpperCase();
    case "sin_forma":
      return proveedor.replace(/\s+(S\.A\.S\.|LTDA\.|S\.A\.|y CIA S\. en C\.)$/i, "").trim();
    case "compacto":
      return proveedor.replace(/\s+/g, "").toUpperCase();
    default:
      return proveedor;
  }
}

async function main() {
  await mkdir(FACTURAS_DIR, { recursive: true });

  const groundTruth: GtEntry[] = [];
  const extracto: ExtractoLineaOut[] = [];

  const numeroPrefijos = ["FAC", "FV", "A", "REC", "INV"];

  for (let i = 0; i < N; i++) {
    const designIndex = i % 5;
    const degraded = i % 10 < 3; // 30%
    const matched = i % 10 < 7; // 70%

    const badNit = i % 13 === 4;
    const arithSmall = i % 11 === 6;
    const arithLarge = i % 17 === 9;

    const ivaPct = rng.weighted([
      [19, 70],
      [5, 20],
      [0, 10],
    ] as const);

    const subtotal = rng.int(50, 3000) * 1000;
    const ivaExact = Math.round((subtotal * ivaPct) / 100);
    let iva = ivaExact;
    let total = subtotal + iva;
    let issue: GtEntry["meta"]["issue"] = null;

    if (arithSmall) {
      total = subtotal + iva + rng.int(1, 2);
      issue = "descuadre_menor";
    } else if (arithLarge) {
      total = subtotal + iva + rng.int(15, 50);
      issue = "descuadre_grande";
    }

    const nitBase = String(rng.int(800000000, 999999999));
    let nit = formatNit(nitBase);
    if (badNit) {
      const correct = nitCheckDigit(nitBase);
      const wrong = (correct + 3) % 10;
      nit = `${nitBase}-${wrong}`;
      issue = "nit_invalido";
    }

    const proveedor = `${rng.pick(NOMBRES_BASE)} ${rng.pick(FORMAS_JURIDICAS)}`;
    const fecha = randomFechaAgosto2026();
    const numeroFactura = `${numeroPrefijos[designIndex]}-${String(i + 1).padStart(4, "0")}`;
    const ciudad = rng.pick(CIUDADES);

    const invoice: Invoice = {
      proveedor,
      nit,
      numeroFactura,
      fecha,
      subtotal,
      iva,
      total,
    };

    const items = splitIntoItems(subtotal);
    const svg = renderInvoiceSvg(designIndex, invoice, items, { ciudad, ivaPct });

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const finalBuffer = degraded ? await degrade(pngBuffer, rng) : pngBuffer;
    const ext = degraded ? "jpg" : "png";
    const filename = `${sanitizeFilename(numeroFactura)}.${ext}`;

    await writeFile(path.join(FACTURAS_DIR, filename), finalBuffer);

    groundTruth.push({
      file: `facturas/${filename}`,
      invoice,
      meta: { designIndex, degraded, issue },
    });

    if (matched) {
      extracto.push({
        fecha: addDaysISO(fecha, rng.int(-3, 3)),
        monto: total,
        contraparte: nombreParaExtracto(proveedor),
        referencia: `TRX${rng.int(100000, 999999)}`,
      });
    }
  }

  // Ruido: lineas de extracto sin factura correspondiente
  for (let k = 0; k < 6; k++) {
    extracto.push({
      fecha: randomFechaAgosto2026(),
      monto: rng.int(20, 900) * 1000,
      contraparte: `${rng.pick(NOMBRES_BASE)} ${rng.pick(FORMAS_JURIDICAS)}`,
      referencia: `TRX${rng.int(100000, 999999)}`,
    });
  }

  // shuffle (Fisher-Yates) para que el extracto no venga en el mismo orden que las facturas
  for (let i = extracto.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [extracto[i], extracto[j]] = [extracto[j], extracto[i]];
  }

  await writeFile(path.join(OUT_DIR, "ground_truth.json"), JSON.stringify(groundTruth, null, 2));

  const csvHeader = "fecha,monto,contraparte,referencia";
  const csvRows = extracto.map(
    (l) => `${l.fecha},${l.monto},"${l.contraparte.replace(/"/g, '""')}",${l.referencia}`
  );
  await writeFile(path.join(OUT_DIR, "extracto.csv"), [csvHeader, ...csvRows].join("\n") + "\n");

  const degradedCount = groundTruth.filter((g) => g.meta.degraded).length;
  const issuesCount = groundTruth.filter((g) => g.meta.issue).length;
  console.log(`Dataset generado: ${N} facturas en ${FACTURAS_DIR}`);
  console.log(`  degradadas: ${degradedCount} (${Math.round((degradedCount / N) * 100)}%)`);
  console.log(`  con problema de negocio inyectado: ${issuesCount}`);
  console.log(`  lineas en extracto.csv: ${extracto.length} (match esperado: ${groundTruth.length ? extracto.length - 6 : 0} + 6 ruido)`);
  console.log(`  ground_truth.json y extracto.csv escritos en ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
