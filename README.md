# 📊 Tally — Agente Local Autónomo para Conciliación de Facturas y Extractos

> **Aleph Hackathon 2026** — *Track: Local agents para operaciones (Tether / QVAC Track)*  
> **Premios objetivo**: 🥇 Track 1 (1st place) · 🥈 Track 2 (Tool use & reliability) · 🛡️ The Vault Guardian ($500 USDt pool)

**Tally** es un agente financiero autónomo que procesa facturas comerciales (imágenes/escaneos con ruido, rotación o baja calidad), extrae datos estructurados con un modelo VLM multimodal corriendo **100% en local mediante `@qvac/sdk`**, aplica reglas de validación tributaria (DIAN), concilia los montos contra extractos bancarios en segundos y genera reportes auditables con niveles de confianza y acciones recomendadas en 5 segundos.

---

## 🔗 Permalinks de Integración con QVAC (Para los Jueces)

Direct links to the source code files where local inference and model orchestration happen:

- **Inicialización del Modelo y Ciclo de Vida QVAC**: [`src/qvac/client.ts`](src/qvac/client.ts)
  - Carga del modelo multimodal: `loadModel({ modelSrc: SMOLVLM2_500M_MULTIMODAL_Q8_0, modelConfig: { projectionModelSrc: MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 } })`
  - Inferencia multimodal streaming/final: `completion({ modelId, history: [{ role: "user", content: prompt, attachments: [{ path }] }] })`
  - Descarga de recursos en memoria: `unloadModel({ modelId })`
- **Prompt Engineering y Extracción Estructurada con Zod**: [`src/extract/qvac.ts`](src/extract/qvac.ts)
  - Sanitización de salidas markdown/JSON, corrección de formato monetario y reintentos automáticos.
- **Cuantificación de Confianza e Incertidumbre**: [`src/validate/confidence.ts`](src/validate/confidence.ts)
  - Cálculo de confianza objetiva (0-100%) para evitar alucinaciones.
- **Suite de Jailbreaks para The Vault Guardian**: [`tools/vault-guardian/cracker.ts`](tools/vault-guardian/cracker.ts)

---

## 💻 Especificaciones de Modelo y Hardware

| Parámetro | Especificación |
|---|---|
| **Modelo Principal** | `SmolVLM2-500M-Instruct` (`SMOLVLM2_500M_MULTIMODAL_Q8_0`) |
| **Proyección Multimodal** | `MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0` |
| **Cuantización** | `Q8_0` (alta fidelidad en números y caracteres pequeños) |
| **Consumo de RAM** | **~500 MB** (muy por debajo del límite de 4GB de laptops estándar) |
| **Privacidad** | **100% Local / Offline**. Cero datos financieros enviados a APIs externas o nube. |
| **Runtime** | Bare runtime / Node.js con `@qvac/sdk` |

---

## 🚀 Setup Rápido (Desde un clon limpio)

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/andreMD287/Tally.git
cd Tally
npm install

# 2. Generar el dataset determinístico de 40 facturas con casos de prueba
npm run gen:dataset

# 3. Ejecutar la suite de tests unitarios (40+ tests)
npm test
```

---

## 🛠️ Comandos y Modos de Ejecución

### 1. Demostración Completa del Hackathon
Muestra el flujo end-to-end de extracción, deduplicación, validación DIAN, pagos divididos y reportes:
```bash
npm run demo
```

### 2. CLI en Modo Real con QVAC (SmolVLM2 local)
```bash
npm run cli -- ./data/facturas ./data/extracto.csv --qvac
```

### 3. CLI en Modo Prueba (Ground Truth)
Valida la lógica del pipeline contra la verdad de campo:
```bash
npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json
```

### 4. Auditoría Humana Interactiva en 5 Segundos (Human-in-the-Loop)
Permite al operador resolver en terminal las facturas observadas (`[A]probar`, `[R]echazar`, `[O]bservar`):
```bash
npm run audit
```

### 5. Suite de Benchmarks y Evaluación Cuantitativa
Calcula métricas de precisión campo por campo, imágenes limpias vs 30% degradadas, y latencias:
```bash
npm run bench
```

### 6. Matriz de Estabilidad Multi-Run (Track 2)
Ejecuta $N=5$ corridas consecutivas para demostrar determinismo y resiliencia:
```bash
npm run bench:stability
```

### 7. Suite para The Vault Guardian Challenge ($500 USDt)
Ejecuta la batería de vectores de prompt injection contra la IA defensora:
```bash
npm run vault:crack
```

---

## 📁 Archivos de Salida Generados

- `out/libro_compras.csv`: Libro contable listo para exportación tributaria con referencias bancarias y nivel de confianza.
- `out/discrepancias.md`: Reporte categorizado por severidad (🔴 Crítico, 🟡 Advertencia, 🔵 Informativo) con acciones en 5 segundos.
- `out/benchmark_results.md`: Métricas cuantitativas de precisión y latencia.
- `out/stability_matrix.md`: Matriz de consistencia multi-run para Track 2.
- `out/auditoria_resoluciones.json`: Log auditable de resoluciones tomadas por el operador humano.

---

## 👥 División de Trabajo

- **A (Inferencia & Modelos)**: `src/qvac/`, `src/extract/`, `bench/`. Docker, modelo SmolVLM2, prompts VLM, reintentos.
- **B (Pipeline, Datos & Auditoría)**: `scripts/`, `src/ingest/`, `src/validate/`, `src/match/`, `src/report/`, `cli.ts`, `data/`.
- **Compartido**: `src/types.ts`.
