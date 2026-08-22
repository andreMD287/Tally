# Tally

Conciliacion local de facturas con QVAC (Aleph Hackathon, Track "Local agents para operaciones").

Lee facturas (imagenes), extrae los datos con un VLM corriendo 100% local via `@qvac/sdk`,
valida reglas de negocio, concilia contra un extracto bancario y genera un libro de compras
+ un reporte de discrepancias auditable por un humano en 5 segundos.

## Division de trabajo

- **A (inferencia)**: `src/qvac/`, `src/extract/`, `bench/`. Docker, modelo, prompts del VLM, reintentos, benchmark.
- **B (pipeline y datos)**: `scripts/`, `src/ingest/`, `src/validate/`, `src/match/`, `src/report/`, `cli.ts`, `data/`.
- **Compartido**: `src/types.ts`. Se toca de a dos, nunca solo.

La costura es el objeto `Invoice` (ver `src/types.ts`). Nadie toca el codigo del otro lado; si algo esta roto, se avisa.

## Setup

```bash
npm install
npm run gen:dataset   # genera 40 facturas sinteticas en data/ (deterministico, seed fija)
npm test               # corre la suite de validate/ y match/
```

`data/` esta en `.gitignore` porque el generador es deterministico: cualquiera que corra
`npm run gen:dataset` obtiene exactamente el mismo dataset.

## CLI

```bash
# modo real: lee imagenes de data/facturas y usa extract() (hoy: mock, luego: QVAC)
npm run cli -- ./data/facturas ./data/extracto.csv

# modo prueba: usa el ground truth como si fuera la salida perfecta del modelo,
# para validar la logica del pipeline (validate + match + report) sin depender del modelo
npm run cli -- ./data/facturas ./data/extracto.csv --ground-truth ./data/ground_truth.json
```

Salida en `out/libro_compras.csv` y `out/discrepancias.md`.

## Estado

- [x] Contrato (`src/types.ts`) + mock de `extract()`
- [x] Generador de dataset (40 facturas, 5 disenos, IVA 19/5/0%, ~30% degradadas, ~70% conciliables)
- [x] `validate()`: aritmetica (+-$2), tarifa de IVA, digito de verificacion de NIT, fecha
- [x] Matching factura <-> extracto (monto exacto + fecha +-3 dias, desempate por nombre, pago dividido en 2 transacciones)
- [x] Deteccion de facturas duplicadas (mismo numero+total reenviado)
- [x] Reportes (`libro_compras.csv`, `discrepancias.md`)
- [x] CLI end-to-end (probado con el mock y con ground truth)
- [ ] Extraccion real con QVAC (A)
- [ ] Integracion final sin mock
- [ ] Benchmark y metricas
- [ ] Demo

## Nota para A: modelo a usar

**VisionPsy NO esta soportado por el SDK de QVAC todavia**, aunque existe en Hugging Face
(la pagina del hackathon lo dice explicitamente: *"Vision in QVAC is good, but not via
VisionPsy for now"*). No perder tiempo intentando cargarlo por el loader estandar.

Lo que si esta documentado y listo para usar en el SDK JS/TS hoy:

| Para que | Modelo | Como se carga |
|---|---|---|
| VLM multimodal (imagen -> texto/JSON) | **SmolVLM2** + mmproj | constante `SMOLVLM2_500M_MULTIMODAL_Q8_0` (500M, Q8_0) |
| Alternativa mas grande/pesada | Qwen2.5-Omni o Qwen3-VL + mmproj | mismo patron, mas RAM |
| OCR puro (deteccion+reconocimiento) | pipeline ONNX (CRAFT) | constante `OCR_LATIN`, requiere `detector_craft.onnx` + `recognizer_<lang>.onnx` |

Recomendacion: arrancar con `SMOLVLM2_500M_MULTIMODAL_Q8_0` como VLM principal (imagen +
prompt pidiendo el JSON con la forma de `InvoiceSchema` en `src/types.ts`). Es liviano
(500M, muy por debajo del techo de 4GB de RAM) y no depende de configuracion manual.
`OCR_LATIN` queda como refuerzo opcional para casos degradados, no hace falta para el MVP.

El benchmark de A (Bloque 5) deberia comparar SmolVLM2-Q8_0 vs Qwen (si el hardware
aguanta), no las variantes de VisionPsy como decia el plan original.
