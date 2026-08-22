@echo off
echo ==================================================================
echo   🚀 INICIANDO TALLY: AGENTE LOCAL PARA OPERACIONES (HACKATHON) 
echo ==================================================================

if not exist node_modules (
  echo 📦 Instalando dependencias de Node...
  call npm install
)

if not exist data\facturas (
  echo 📄 Generando dataset de facturas sinteticas y extracto...
  call npm run gen:dataset
)

echo 🧪 Ejecutando suite de 50+ pruebas unitarias...
call npm test

echo ⚙️ Ejecutando pipeline de conciliacion y auditoria en 5 segundos...
call npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json

echo 🖥️ Levantando Dashboard Web en http://localhost:3000...
call npm run ui
