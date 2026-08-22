#!/usr/bin/env bash
set -e

echo "=================================================================="
echo "  🚀 INICIANDO TALLY: AGENTE LOCAL PARA OPERACIONES (HACKATHON) "
echo "=================================================================="

# 1. Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias de Node..."
  npm install
fi

# 2. Generar dataset si no existe
if [ ! -d "data/facturas" ]; then
  echo "📄 Generando dataset de facturas sintéticas y extracto..."
  npm run gen:dataset
fi

# 3. Ejecutar suite de pruebas
echo "🧪 Ejecutando suite de 50+ pruebas unitarias..."
npm test

# 4. Ejecutar conciliación y generar certificado criptográfico
echo "⚙️ Ejecutando pipeline de conciliación y auditoría en 5 segundos..."
npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json

# 5. Iniciar Dashboard Web
echo "🖥️ Levantando Dashboard Web en http://localhost:3000..."
npm run ui
