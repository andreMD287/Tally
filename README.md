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
