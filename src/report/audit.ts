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
  decision: "APPROVED" | "REJECTED" | "FLAGGED";
  timestamp: string;
  notes: string;
}

function parseCsv(content: string): AuditRow[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const rows: AuditRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
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
=============================================================================
               TALLY : 5-SECOND OPERATIONAL AUDIT TOOL
         Human-in-the-Loop Triage for Financial Discrepancies
=============================================================================
`);

  const csvPath = path.resolve("out", "libro_compras.csv");
  let csvRaw = "";
  try {
    csvRaw = await readFile(csvPath, "utf-8");
  } catch {
    console.error("Error: out/libro_compras.csv not found. Please run 'npm run cli' or 'npm run demo' first.");
    process.exit(1);
  }

  const rows = parseCsv(csvRaw);
  const flagged = rows.filter((r) => r.validacion === "ERROR" || r.conciliacion === "sin_match");

  console.log(`Total Invoices in Ledger: ${rows.length}`);
  console.log(`Invoices Flagged for Human Review: ${flagged.length}\n`);

  if (flagged.length === 0) {
    console.log("All invoices are clean. Zero pending discrepancies.");
    return;
  }

  const resolutions: AuditResolution[] = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (let i = 0; i < flagged.length; i++) {
    const item = flagged[i];
    console.log("-----------------------------------------------------------------------------");
    console.log(`[${i + 1}/${flagged.length}] INVOICE: ${item.numeroFactura || "(No Number)"}`);
    console.log(`  Supplier:    ${item.proveedor} (Tax ID: ${item.nit || "N/A"})`);
    console.log(`  Date:        ${item.fecha} | Total: $${item.total.toLocaleString("en-US")}`);
    console.log(`  Validation:  ${item.validacion} | Confidence: ${item.confianza} (${item.nivelConfianza.toUpperCase()})`);
    console.log(`  Bank Match:  ${item.conciliacion === "sin_match" ? "UNMATCHED (NO RECORD)" : item.conciliacion}`);
    if (item.errores) {
      console.log(`  Discrepancy: ${item.errores}`);
    }

    const answer = (await askQuestion(
      rl,
      `\n  Auditor Action: ([A]pprove / [R]eject / [F]lag / [S]kip): `
    )).trim().toUpperCase();

    let decision: "APPROVED" | "REJECTED" | "FLAGGED" | null = null;
    let notes = "";

    if (answer === "A") {
      decision = "APPROVED";
      notes = "Manually approved by auditor";
    } else if (answer === "R") {
      decision = "REJECTED";
      notes = "Rejected due to unresolvable discrepancy";
    } else if (answer === "F") {
      decision = "FLAGGED";
      notes = await askQuestion(rl, "  Audit Note / Reason: ");
    }

    if (decision) {
      resolutions.push({
        numeroFactura: item.numeroFactura,
        proveedor: item.proveedor,
        total: item.total,
        decision,
        timestamp: new Date().toISOString(),
        notes,
      });
      console.log(`  Recorded as: ${decision}\n`);
    } else {
      console.log(`  Skipped without resolution.\n`);
    }
  }

  rl.close();

  if (resolutions.length > 0) {
    const outDir = path.resolve("out");
    await mkdir(outDir, { recursive: true });
    const auditFilePath = path.join(outDir, "auditoria_resoluciones.json");
    await writeFile(auditFilePath, JSON.stringify(resolutions, null, 2));
    console.log(`\nAudit completed. ${resolutions.length} resolutions saved to:`);
    console.log(`   ${auditFilePath}\n`);
  }
}

main().catch((err) => {
  console.error("Audit tool error:", err);
  process.exit(1);
});
