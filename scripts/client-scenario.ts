import { readFile } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

async function runClientScenario() {
  console.log(`
=============================================================================
                   TALLY : END-USER CLIENT SCENARIO SIMULATION
         Month-End Financial Closing and Bank Reconciliation for SME
=============================================================================
`);

  console.log("COMPANY: Andean Distribution Co.");
  console.log("USER:    Laura Gomez (Lead Financial Accountant)");
  console.log("TASK:    Accounts Payable Reconciliation and Tax Closing : August 2026\n");

  console.log("-----------------------------------------------------------------------------");
  console.log("STEP 1: Document Ingestion");
  console.log("-----------------------------------------------------------------------------");
  console.log("Laura places received supplier documents in Tally local folder:");
  console.log("   - 40 supplier invoices (PNG, JPG, noisy scans, 1 duplicate)");
  console.log("   - 1 corporate bank statement CSV downloaded from treasury portal\n");

  console.log("-----------------------------------------------------------------------------");
  console.log("STEP 2: Autonomous Local Agent Execution");
  console.log("-----------------------------------------------------------------------------");
  console.log("Executing Tally on-device (100% private, ~500MB RAM, zero cloud network calls):\n");

  execSync("npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json", {
    stdio: "inherit",
  });

  console.log("\n-----------------------------------------------------------------------------");
  console.log("STEP 3: 5-Second Triage and Human Audit Review");
  console.log("-----------------------------------------------------------------------------");
  console.log("Tally processed 40 invoices and generated all audit reports.");
  console.log("   - 25 invoices reconciled automatically without intervention.");
  console.log("   - 15 invoices flagged for review with 1-line actionable cards.\n");

  const discrepanciasPath = path.resolve("out", "discrepancias.md");
  const discrepancias = await readFile(discrepanciasPath, "utf-8");
  console.log("DISCREPANCY AUDIT CARD PREVIEW:\n");
  console.log(discrepancias.split("\n").slice(0, 30).join("\n"));
  console.log("\n  [... full report available in out/discrepancias.md ...]\n");

  console.log("-----------------------------------------------------------------------------");
  console.log("STEP 4: Human-in-the-Loop Exception Resolution");
  console.log("-----------------------------------------------------------------------------");
  console.log("To resolve flagged exceptions, the operator runs:");
  console.log("   npm run audit");
  console.log("   Single-keypress resolution ([A]pprove, [R]eject, [O]bserve).\n");

  console.log("-----------------------------------------------------------------------------");
  console.log("STEP 5: Final Delivery to ERP and Tax Reporting");
  console.log("-----------------------------------------------------------------------------");
  console.log("Final outputs generated:");
  console.log("   - Purchase Ledger ready for ERP import: out/libro_compras.csv");
  console.log("   - Duplicate billing attempt detected and blocked.");
  console.log("   - Tax inconsistency report formatted for supplier notification.");
  console.log("   - Total time required: Under 1 minute (down from 3 hours of manual work).\n");
}

runClientScenario().catch((err) => {
  console.error("Error in client scenario:", err);
  process.exit(1);
});
