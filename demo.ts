import { readFile } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

async function runDemo() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ████████╗ █████╗ ██╗     ██╗  ██╗   ██╗                              ║
║     ╚══██╔══╝██╔══██╗██║     ██║  ╚██╗ ██╔╝                              ║
║        ██║   ███████║██║     ██║   ╚████╔╝                               ║
║        ██║   ██╔══██║██║     ██║    ╚██╔╝                                ║
║        ██║   ██║  ██║███████╗███████╗██║                                 ║
║        ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝                                 ║
║                                                                           ║
║    Agente Local Autónomo para Conciliación de Facturas y Extractos        ║
║         (Aleph Hackathon - Track: Local agents para operaciones)         ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  console.log("🚀 [1/4] Ejecutando pipeline completo con ground-truth y reglas de negocio...");
  execSync("npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json", {
    stdio: "inherit",
  });

  console.log("\n📊 [2/4] Vista previa del reporte de Discrepancias (out/discrepancias.md):\n");
  const discrepanciasPath = path.resolve("out", "discrepancias.md");
  const discrepanciasContent = await readFile(discrepanciasPath, "utf-8");
  const previewLines = discrepanciasContent.split("\n").slice(0, 35).join("\n");
  console.log(previewLines);
  console.log("\n  (... ver reporte completo en out/discrepancias.md ...)\n");

  console.log("📑 [3/4] Vista previa del Libro de Compras (out/libro_compras.csv):\n");
  const libroComprasPath = path.resolve("out", "libro_compras.csv");
  const libroContent = await readFile(libroComprasPath, "utf-8");
  const previewCsv = libroContent.split("\n").slice(0, 10).join("\n");
  console.log(previewCsv);
  console.log("\n  (... ver CSV completo en out/libro_compras.csv ...)\n");

  console.log("✨ [4/4] Demo finalizada con éxito.");
  console.log("   Todo el procesamiento ocurrió 100% en local, sin enviar datos a la nube.");
}

runDemo().catch((err) => {
  console.error("Error en demo:", err);
  process.exit(1);
});
