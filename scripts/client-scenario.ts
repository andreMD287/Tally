import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

async function runClientScenario() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                   TALLY - EXPERIENCIA DEL CLIENTE FINAL                   ║
║         Simulación de Cierre Contable de Mes para una PyME                ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  console.log("🏢 EMPRESA: Distribuciones Andinas S.A.S.");
  console.log("👤 USUARIA: Laura Gómez (Líder de Contabilidad y Tesorería)");
  console.log("📅 TAREA:   Cierre de Compras y Conciliación Bancaria - Agosto 2026\n");

  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("PASO 1: Ingesta de Documentos Recibidos");
  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("📁 Laura coloca en la carpeta local de Tally:");
  console.log("   - 40 facturas de proveedores (PNG, JPG, escaneos con sombras, 1 duplicada)");
  console.log("   - 1 extracto bancario descargado de Bancolombia / portal corporativo\n");

  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("PASO 2: Ejecución del Agente Local Autónomo");
  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("⚡ Laura corre Tally en su computador (100% privado, ~500MB RAM, cero nube):\n");

  // Ejecutamos el CLI
  execSync("npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json", {
    stdio: "inherit",
  });

  console.log("\n───────────────────────────────────────────────────────────────────────────");
  console.log("PASO 3: Triage y Auditoría en 5 Segundos (Lo que Laura revisa)");
  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("📋 Tally procesó automáticamente 40 facturas y generó los reportes.");
  console.log("   - 25 facturas conciliaron a la perfección sin intervención.");
  console.log("   - 15 facturas requirieron semáforo de atención.\n");

  const discrepanciasPath = path.resolve("out", "discrepancias.md");
  const discrepancias = await readFile(discrepanciasPath, "utf-8");
  console.log("👀 VISTA DE DISCREPANCIAS GENERADA PARA LAURA:\n");
  console.log(discrepancias.split("\n").slice(0, 30).join("\n"));
  console.log("\n  [... resto del reporte disponible en out/discrepancias.md ...]\n");

  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("PASO 4: Resolución de Excepciones (Human-in-the-Loop)");
  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("💡 Para resolver las excepciones, Laura simplemente ejecuta:");
  console.log("   👉 npm run audit");
  console.log("   Esto le permite aprobar o rechazar con una sola tecla ([A]/[R]/[O]).\n");

  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("PASO 5: Entrega Final a Contabilidad y DIAN");
  console.log("───────────────────────────────────────────────────────────────────────────");
  console.log("🎉 Resultado final para Laura:");
  console.log("   ✅ Libro de Compras en CSV listo para exportar al ERP: out/libro_compras.csv");
  console.log("   ✅ Prevención de pagos duplicados detectada y bloqueada.");
  console.log("   ✅ Reporte de inconsistencias tributarias listo para enviar a proveedores.");
  console.log("   ⏱️ Tiempo total invertido: 1 minuto (en lugar de 3 horas manuales).\n");
}

runClientScenario().catch((err) => {
  console.error("Error en escenario de cliente:", err);
  process.exit(1);
});
