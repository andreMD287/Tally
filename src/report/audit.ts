import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

interface AuditRow {
  archivo: string;
  numeroFactura: string;
  proveedor: string;
  nit: string;
  fecha: string;
  total: number;
  validacion: string;
  confianza: string;
  nivelConfianza: string;
  errores: string;
  conciliacion: string;
}

interface AuditResolution {
  numeroFactura: string;
  proveedor: string;
  total: number;
  decision: "APROBADA" | "RECHAZADA" | "OBSERVADA";
  timestamp: string;
  observaciones: string;
}

function parseCsv(content: string): AuditRow[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const rows: AuditRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parse with quote awareness
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      const val = match[1] ? match[1].replace(/""/g, '"') : match[2] ?? "";
      matches.push(val);
    }

    if (matches.length >= 12) {
      rows.push({
        archivo: matches[0],
        numeroFactura: matches[1],
        proveedor: matches[2],
        nit: matches[3],
        fecha: matches[4],
        total: Number(matches[7]) || 0,
        validacion: matches[8],
        confianza: matches[9],
        nivelConfianza: matches[10],
        errores: matches[11],
        conciliacion: matches[12],
      });
    }
  }
  return rows;
}

async function askQuestion(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║               TALLY - AUDITORÍA OPERATIVA EN 5 SEGUNDOS                   ║
║         Human-in-the-Loop Triage para Discrepancias Financieras           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  const csvPath = path.resolve("out", "libro_compras.csv");
  let csvRaw = "";
  try {
    csvRaw = await readFile(csvPath, "utf-8");
  } catch {
    console.error("❌ No se encontró out/libro_compras.csv. Ejecuta primero 'npm run cli' o 'npm run demo'.");
    process.exit(1);
  }

  const rows = parseCsv(csvRaw);
  const flagged = rows.filter((r) => r.validacion === "ERROR" || r.conciliacion === "sin_match");

  console.log(`📋 Total de facturas en libro: ${rows.length}`);
  console.log(`🔍 Facturas marcadas para revisión humana: ${flagged.length}\n`);

  if (flagged.length === 0) {
    console.log("✅ No hay discrepancias pendientes por auditar.");
    return;
  }

  const resolutions: AuditResolution[] = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (let i = 0; i < flagged.length; i++) {
    const item = flagged[i];
    console.log("───────────────────────────────────────────────────────────────────────────");
    console.log(`[${i + 1}/${flagged.length}] FACTURA: ${item.numeroFactura || "(Sin número)"}`);
    console.log(`  Proveedor:  ${item.proveedor} (NIT: ${item.nit || "N/A"})`);
    console.log(`  Fecha:      ${item.fecha} | Total: $${item.total.toLocaleString("es-CO")}`);
    console.log(`  Validación: ${item.validacion} | Confianza: ${item.confianza} (${item.nivelConfianza.toUpperCase()})`);
    console.log(`  Estado Banco: ${item.conciliacion === "sin_match" ? "❌ SIN PAGO REGISTRADO" : item.conciliacion}`);
    if (item.errores) {
      console.log(`  ⚠️  Errores detectados: ${item.errores}`);
    }

    const answer = (await askQuestion(
      rl,
      `\n  ¿Decisión del auditor? ([A]probar / [R]echazar / [O]bservar / [S]altar): `
    )).trim().toUpperCase();

    let decision: "APROBADA" | "RECHAZADA" | "OBSERVADA" | null = null;
    let obs = "";

    if (answer === "A") {
      decision = "APROBADA";
      obs = "Aprobada manualmente por el auditor";
    } else if (answer === "R") {
      decision = "RECHAZADA";
      obs = "Rechazada por inconsistencia insubsanable";
    } else if (answer === "O") {
      decision = "OBSERVADA";
      obs = await askQuestion(rl, "  Nota de observación: ");
    }

    if (decision) {
      resolutions.push({
        numeroFactura: item.numeroFactura,
        proveedor: item.proveedor,
        total: item.total,
        decision,
        timestamp: new Date().toISOString(),
        observaciones: obs,
      });
      console.log(`  ✅ Registrado como: ${decision}\n`);
    } else {
      console.log(`  ⏩ Omitida sin resolución.\n`);
    }
  }

  rl.close();

  if (resolutions.length > 0) {
    const outDir = path.resolve("out");
    await mkdir(outDir, { recursive: true });
    const auditFilePath = path.join(outDir, "auditoria_resoluciones.json");
    await writeFile(auditFilePath, JSON.stringify(resolutions, null, 2));
    console.log(`\n🎉 Auditoría finalizada. ${resolutions.length} resoluciones guardadas en:`);
    console.log(`   ${auditFilePath}\n`);
  }
}

main().catch((err) => {
  console.error("Error en auditoría:", err);
  process.exit(1);
});
