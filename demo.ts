import { readFile } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

async function runDemo() {
  console.log(`
=============================================================================
                                  TALLY
        Local Autonomous Operations Agent for Invoice Reconciliation
            (Aleph Hackathon : Tether QVAC Track : Track 1 & 2)
=============================================================================
`);

  console.log("[1/4] Executing end-to-end reconciliation with ground-truth and tax rules...");
  execSync("npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json", {
    stdio: "inherit",
  });

  console.log("\n[2/4] Discrepancy Triage Report Preview (out/discrepancias.md):\n");
  const discrepanciasPath = path.resolve("out", "discrepancias.md");
  const discrepanciasContent = await readFile(discrepanciasPath, "utf-8");
  const previewLines = discrepanciasContent.split("\n").slice(0, 35).join("\n");
  console.log(previewLines);
  console.log("\n  (... full report in out/discrepancias.md ...)\n");

  console.log("[3/4] Purchase Ledger Preview (out/libro_compras.csv):\n");
  const libroComprasPath = path.resolve("out", "libro_compras.csv");
  const libroContent = await readFile(libroComprasPath, "utf-8");
  const previewCsv = libroContent.split("\n").slice(0, 10).join("\n");
  console.log(previewCsv);
  console.log("\n  (... full CSV in out/libro_compras.csv ...)\n");

  console.log("[4/4] Demo completed successfully.");
  console.log("All processing executed 100% on-device with zero cloud network calls.");
}

runDemo().catch((err) => {
  console.error("Demo error:", err);
  process.exit(1);
});
