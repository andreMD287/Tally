# 📊 Tally — Agente Local Autónomo para Conciliación de Facturas y Extractos

> **Aleph Hackathon 2026** — *Track: Local agents para operaciones (Tether / QVAC Track)*  
> **Premios objetivo**: 🥇 Track 1 (1st place) · 🥈 Track 2 (Tool use & reliability) · 🛡️ The Vault Guardian ($500 USDt pool)

**Tally** es un agente financiero autónomo que procesa facturas comerciales (imágenes/escaneos con ruido, fotos de celular, rotación o baja calidad), extrae datos estructurados con un modelo VLM multimodal corriendo **100% en local mediante `@qvac/sdk` (SmolVLM2-500M)**, aplica validaciones tributarias multi-país (**Colombia DIAN, Argentina ARCA/AFIP, México SAT, Global**), concilia los montos contra extractos bancarios en segundos, genera un **Sello Criptográfico SHA-256 de Privacidad** y despliega un **Dashboard Web Interactivo** para auditoría humana en 5 segundos.

---

## 🏆 Los 4 Pilares de Ingeniería de Tally

1. 🧮 **Motor de Auto-Corrección y Resiliencia (*Self-Healing Engine*)**:
   - Reconstruye algebraicamente subtotales o impuestos faltantes cuando una foto con sombras o reflejos degrada la visibilidad parcial de la factura ($\text{subtotal} = \text{total} - \text{iva}$ o $\text{subtotal} = \text{total} / (1 + \text{tasa})$), marcándola como `[AUTO-REPARADO]` para auditoría humana.
2. 🖥️ **Dashboard Web Local Interactivo (`npm run ui` en `http://localhost:3000`)**:
   - Interfaz gráfica moderna en Dark Mode para explorar KPIs en tiempo real, visualizar facturas, niveles de confianza e interactuar con el pipeline sin depender únicamente de la terminal.
3. 🛡️ **Sello Criptográfico de Auditoría Local (SHA-256 Proof of Privacy)**:
   - Genera un recibo matemático inmutable ([`out/certificado_auditoria.json`](out/certificado_auditoria.json)) con digest SHA-256 que certifica a auditores fiscales que la conciliación ocurrió 100% on-device con cero fugas de datos a la nube.
4. 🌎 **Motor Tributario Multi-Jurisdicción**:
   - Soporte nativo para **Colombia (DIAN - NIT Módulo 11)**, **Argentina (ARCA/AFIP - CUIT Módulo 11)**, **México (SAT - RFC con homoclave)** y **Global (USA/Europa)**.

---

## 🔗 Permalinks de Integración con QVAC (Para los Jueces)

Enlaces directos a los archivos clave donde ocurre la orquestación e inferencia local:

- **Inicialización del Modelo y Ciclo de Vida QVAC**: [`src/qvac/client.ts`](src/qvac/client.ts)
  - Carga del modelo multimodal: `loadModel({ modelSrc: SMOLVLM2_500M_MULTIMODAL_Q8_0, modelConfig: { projectionModelSrc: MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 } })`
  - Inferencia multimodal: `completion({ modelId, history: [{ role: "user", content: prompt, attachments: [{ path }] }] })`
  - Descarga de memoria: `unloadModel({ modelId })`
- **Extracción Estructurada con Zod y Preprocesamiento EXIF**: [`src/extract/qvac.ts`](src/extract/qvac.ts)
- **Motor de Auto-Corrección y Resiliencia (Self-Healing)**: [`src/validate/heal.ts`](src/validate/heal.ts)
- **Motor Multi-Jurisdicción (Colombia, Argentina, México, Global)**: [`src/validate/jurisdictions/`](src/validate/jurisdictions/)
- **Cuantificación de Confianza e Incertidumbre (0-100%)**: [`src/validate/confidence.ts`](src/validate/confidence.ts)
- **Certificado Criptográfico SHA-256**: [`src/report/crypto-certificate.ts`](src/report/crypto-certificate.ts)
- **Dashboard Web Local**: [`src/ui/server.ts`](src/ui/server.ts)
- **Suite para The Vault Guardian**: [`tools/vault-guardian/cracker.ts`](tools/vault-guardian/cracker.ts)

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

## 🚀 Setup Rápido en 1 Clic

### Opción A: Ejecución Directa en tu Terminal
```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/andreMD287/Tally.git
cd Tally
npm install

# 2. Generar dataset determinístico y correr tests (53 tests unitarios)
npm run gen:dataset
npm test

# 3. Iniciar el Dashboard Web Interactivo
npm run ui
# 👉 Abre http://localhost:3000 en tu navegador
```

### Opción B: Ejecución en 1 Clic con Scripts Automáticos
- **En Windows**: Doble clic o ejecutar `run.bat`
- **En Linux / macOS**: Ejecutar `./run.sh`
- **Con Docker**: `docker compose up --build`

---

## 🛠️ Comandos y Modos de Ejecución

### 1. Dashboard Web Local Interactivo
Levanta la interfaz gráfica en `localhost:3000` con KPIs, tabla de auditoría y descargas en tiempo real:
```bash
npm run ui
```

### 2. Simulación de Experiencia del Cliente Final
Simula el cierre contable real de una PyME (*Distribuciones Andinas S.A.S.*):
```bash
npm run client:demo
```

### 3. CLI en Modo Real con QVAC (SmolVLM2 local)
```bash
npm run cli -- ./data/facturas ./data/extracto.csv --qvac
```

### 4. CLI con Selección de Jurisdicción Fiscal
```bash
npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json --country AR
```

### 5. Auditoría Humana Interactiva en Terminal (Human-in-the-Loop)
Permite al operador resolver en terminal las facturas observadas (`[A]probar`, `[R]echazar`, `[O]bservar`):
```bash
npm run audit
```

### 6. Suite de Benchmarks Cuantitativos y Estabilidad Multi-Run (Track 2)
```bash
npm run bench
npm run bench:stability
```

### 7. Suite para The Vault Guardian Challenge ($500 USDt)
```bash
npm run vault:crack
```

---

## 📁 Archivos de Salida Generados

- `out/libro_compras.csv`: Libro contable listo para exportación tributaria con referencias bancarias y nivel de confianza.
- `out/discrepancias.md`: Reporte categorizado por severidad (🔴 Crítico, 🟡 Advertencia, 🔵 Informativo) con acciones en 5 segundos.
- `out/certificado_auditoria.json`: Certificado criptográfico inmutable con digest SHA-256 de privacidad on-device.
- `out/benchmark_results.md`: Métricas cuantitativas de precisión y latencia.
- `out/stability_matrix.md`: Matriz de consistencia multi-run para Track 2.
- `out/auditoria_resoluciones.json`: Log auditable de resoluciones tomadas por el operador humano.

---

## 📚 Documentación Técnica Detallada

- 💼 **[Casos de Estudio Operativos Reales](docs/case_studies.md)**: 4 escenarios financieros detallados (pago dividido multi-transacción, fraude por duplicado, descuadre aritmético en escaneo degradado, y error de dígito de NIT DIAN).
- 🔬 **[Análisis de Capacidades y Límites de SmolVLM2](docs/model_capabilities_and_limits.md)**: Arquitectura SigLIP + SmolLM2, análisis de modos de falla en modelos 1-4B y mitigaciones de ingeniería de Tally.
- 🏗️ **[Arquitectura del Sistema](docs/architecture.md)**: Diagramas de flujo Mermaid, contratos Zod, capas de resiliencia y filosofía de diseño *Hybrid AI Agent*.
- 🎬 **[Guión del Video Demo](docs/demo_video_script.md)**: Estructura segundo a segundo para la grabación del video de presentación de 2 minutos.

---

## 👥 División de Trabajo

- **A (Inferencia & Modelos)**: `src/qvac/`, `src/extract/`, `bench/`. Docker, modelo SmolVLM2, prompts VLM, reintentos.
- **B (Pipeline, Datos, Auditoría & UI)**: `scripts/`, `src/ingest/`, `src/validate/`, `src/match/`, `src/report/`, `src/ui/`, `cli.ts`, `data/`.
- **Compartido**: `src/types.ts`.
