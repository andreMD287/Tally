# 🏗️ Arquitectura del Sistema: Tally

> **Tally: Local Autonomous Operations Agent for Financial Reconciliation**  
> Diseñado para el **Aleph Hackathon 2026** (Track: Local agents para operaciones / QVAC).

---

## 1. Diagrama de Arquitectura End-to-End

```mermaid
flowchart TD
    subgraph Inputs["📁 Fuentes de Datos Locales (On-Device)"]
        F["📄 Facturas (PNG / JPG / PDF)"]
        E["🏦 Extracto Bancario (extracto.csv)"]
    end

    subgraph ExtractionLayer["🧠 Capa de Inferencia Multimodal Local"]
        QVAC["⚡ QVAC SDK (@qvac/sdk)"]
        VLM["👁️ SmolVLM2-500M (Q8_0) + mmproj"]
        Sanitizer["🧹 JSON Sanitizer & Heuristic Repair"]
        ZodSchema["🛡️ InvoiceSchema (Zod Contract)"]
        
        F --> QVAC
        QVAC --> VLM
        VLM --> Sanitizer
        Sanitizer --> ZodSchema
    end

    subgraph OperationsPipeline["⚙️ Pipeline Operativo y Reglas de Negocio"]
        Dedupe["🛡️ Deduplication Engine"]
        Validate["📋 Business & Tax Validator (DIAN)"]
        Match["💰 Intelligent Bank Matcher"]
        Confidence["📊 Confidence & Uncertainty Quantifier"]

        ZodSchema --> Dedupe
        Dedupe --> Validate
        Validate --> Match
        E --> Match
        Match --> Confidence
    end

    subgraph OutputLayer["📑 Artefactos de Salida y Auditoría Humana"]
        CSV["📑 out/libro_compras.csv"]
        MD["📋 out/discrepancias.md"]
        TUI["💻 Human-in-the-Loop Audit CLI (npm run audit)"]
        Bench["📈 Benchmark & Stability Reports"]

        Confidence --> CSV
        Confidence --> MD
        Confidence --> TUI
        OperationsPipeline --> Bench
    end
```

---

## 2. Contrato de Datos Compartido (`src/types.ts`)

La costura entre la inferencia de visión (Track A) y el pipeline de datos (Track B) es el objeto estricto **`Invoice`**:

```typescript
export const InvoiceSchema = z.object({
  proveedor: z.string(),
  nit: z.string().nullable(),
  numeroFactura: z.string().nullable(),
  fecha: z.string(), // Formato YYYY-MM-DD
  subtotal: z.number(),
  iva: z.number(),
  total: z.number(),
});
```

---

## 3. Capas de Resiliencia del Agente

### Capa 1: Resiliencia de Parseo
Si el modelo VLM envuelve la respuesta en formato conversacional o markdown, el parser heurístico extrae el bloque `{...}` más externo y normaliza caracteres de moneda (`$`), separadores de miles (`.`) y comas decimales (`,`).

### Capa 2: Reglas Tributarias Determinísticas
- **Aritmética**: $\text{subtotal} + \text{iva} \equiv \text{total} \pm 2\text{ COP}$.
- **Algoritmo DIAN**: Verificación del dígito verificador de NIT usando pesos ponderados de módulo 11.
- **Tarifas de IVA válidas**: 19%, 5% y 0% (excluido).

### Capa 3: Conciliación Inteligente Multi-Transacción (Split Match)
Si un pago se realiza en cuotas o dos transferencias consecutivas, el algoritmo explora combinaciones de pares de líneas en el extracto dentro de una ventana de $\pm3$ días para cubrir el total de la factura sin intervención manual.

### Capa 4: Cuantificación de Confianza (Uncertainty Quantification)
El agente asigna un porcentaje de confianza (0-100%) a cada factura. Aquellas con anomalías se marcan para la **auditoría humana en 5 segundos**.
