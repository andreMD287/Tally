# Resultado del smoke test de VisionPsy-Nano

Entorno: Windows 11, AMD Ryzen 7 7730U (8 núcleos / 16 hilos), 16 GB de RAM,
Docker Desktop sobre WSL2 con 7,5 GB asignados y ejecución 100% CPU.

| Métrica | Valor |
|---|---|
| Ruta que funcionó | C — fork parcheado de llama.cpp |
| Tiempo de build (CPU) | 248,98 s (4 min 9 s) |
| Carga del modelo | No aislable con `llama-mtmd-cli`; el CLI solo registra el inicio de carga. Ver TTFT |
| Segundos por factura (460M Q8_0) | 36,83 s promedio (36,96 / 36,16 / 37,35) |
| TTFT (460M Q8_0) | 33,29 s promedio (32,95 / 33,12 / 33,79) |
| Segundos por factura (Flash Q4_K_M imatrix) | 27,72 s promedio (28,75 / 27,74 / 26,69) |
| TTFT (Flash Q4_K_M imatrix) | 24,68 s promedio (25,13 / 24,17 / 24,73) |
| Pico de RAM en inferencia | 866,0 MiB (460M) / 586,5 MiB (Flash) |
| Pico observado durante build | 4,34 GiB del contenedor |
| JSON parseable (460M) | 1/3 como JSON; 0/3 como el objeto estricto solicitado |
| Campos correctos vs. `expected.json` (460M) | 6/21 |
| Totales leídos bien (460M) | 1/3 |
| JSON parseable (Flash) | 3/3 como JSON; 0/3 como el objeto estricto solicitado |
| Campos correctos vs. `expected.json` (Flash) | 1/21 |
| Totales leídos bien (Flash) | 0/3 |
| ¿SDK cargó el modelo? | No probado: el Paso 3 no superó el umbral para habilitar el Paso 4 |

## Compatibilidad del runtime

- **A — Docker Model Runner:** falló después de descargar el modelo (545,47 MB).
  llama.cpp terminó al cargar `mmproj`: `unknown projector type: custom`.
- **B — llama.cpp upstream:** falló con el mismo error:
  `Failed to load vision model ... unknown projector type: custom`.
- **C — fork parcheado:** compiló y ejecutó correctamente en CPU. Una prueba corta
  devolvió `ANDINA, $1.469.135`.

## Salidas crudas — VisionPsy-Nano-460M Q8_0

### `invoice-01.png`

````text
```json
{
  "supplier": "ANDINA",
  "tax_id": "901.234.567-8",
  "invoice_number": "FAC-2026-0815",
  "date": "15/08/2026",
  "subtotal": 1234.567,
  "tax": 19.19
}
```
````

### `invoice-02.png`

````text
```json
{
  "supplier": "Café Sierra NevadaCola",
  "tax_id": "FV-004287",
  "invoice_number": "FV08-01347",
  "date": "20/08/2026",
  "subtotal": 875000,
  "tax": 0,
  "total": 875000
}
```
````

### `invoice-03-degraded.png`

```text
[
  {
    "supplier": "El Puente Ltd.",
    "tax_id": "NIT: 830.112.445-6",
    "invoice_number": "FE-98231",
    "date": "20/08/2026",
    "subtotal": 2850000,
    "tax": 850000,
    "total": 750000
  }
]
```

## Salidas crudas — VisionPsy-Nano-460M-Flash Q4_K_M imatrix

### `invoice-01.png`

```text
[{"supplier": "ANDINA", "tax_id": "15-08/2026", "invoice_number": "Fecha19", "date": "YYYY-MM-DD", "subtotal": 8840000, "tax": 394567, "total": 11234567}
```

### `invoice-02.png`

```text
[{"supplier": "Café Sierra Nevada", "tax_id": "6625000", "invoice_number": "8875.0000", "date": "01/08/2025", "subtotal": 8875.000, "tax": 25.000, "total": 8875.000}]
```

### `invoice-03-degraded.png`

```text
[{"supplier": "El Puente", "tax_id": "98231", "invoice_number": "FE-98231", "date": "2020-08-08", "subtotal": 291900, "tax": 199000, "total": 491990}
```

## Veredicto

**NO-GO para VisionPsy en esta máquina y para un demo en vivo de 40 documentos.**

El bloqueante principal es la combinación de latencia y precisión: incluso Flash tarda
27,72 s por factura (aproximadamente 18,5 minutos para 40), mientras que Nano tarda
aproximadamente 24,6 minutos y solo acierta 6/21 campos. Además, ambos GGUF requieren
mantener un fork parcheado; no funcionan en los runtimes estándar probados.
