# System Architecture: Tally

> **Tally: Local Autonomous Operations Agent for Financial Reconciliation**  
> Built for the **Aleph Hackathon 2026** (Tether QVAC Track: Track 1 and Track 2).

---

## 1. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Inputs["1. Local On-Device Data Inputs"]
        F["Invoices (PNG / JPG / PDF Scans)"]
        E["Bank Statement (extracto.csv)"]
    end

    subgraph ExtractionLayer["2. Local Multimodal Inference Layer"]
        QVAC["QVAC SDK (@qvac/sdk)"]
        VLM["SmolVLM2-500M (Q8_0) + mmproj"]
        Sanitizer["JSON Sanitizer & Heuristic Repair"]
        ZodSchema["InvoiceSchema (Zod Contract)"]
        
        F --> QVAC
        QVAC --> VLM
        VLM --> Sanitizer
        Sanitizer --> ZodSchema
    end

    subgraph OperationsPipeline["3. Operations Pipeline & Business Rules"]
        Dedupe["Deduplication Engine"]
        Validate["Multi-Country Tax Validator (DIAN/ARCA/SAT/Global)"]
        Match["Intelligent Bank Matcher (Exact, Approx, Split)"]
        Confidence["Confidence & Uncertainty Quantifier (0-100%)"]

        ZodSchema --> Dedupe
        Dedupe --> Validate
        Validate --> Match
        E --> Match
        Match --> Confidence
    end

    subgraph OutputLayer["4. Output Artifacts & Human-in-the-Loop"]
        CSV["out/libro_compras.csv (Purchase Ledger)"]
        MD["out/discrepancias.md (5-Second Triage)"]
        TUI["Human-in-the-Loop Audit CLI (npm run audit)"]
        UI["Local Web Dashboard (npm run ui)"]
        Cert["out/certificado_auditoria.json (SHA-256 S Seal)"]

        Confidence --> CSV
        Confidence --> MD
        Confidence --> TUI
        Confidence --> UI
        Confidence --> Cert
    end
```

---

## 2. Shared Data Contract (`src/types.ts`)

The interface between multimodal vision inference (Track A) and the deterministic operational pipeline (Track B) is the strict **`Invoice`** contract:

```typescript
export const InvoiceSchema = z.object({
  proveedor: z.string(),
  nit: z.string().nullable(),
  numeroFactura: z.string().nullable(),
  fecha: z.string(), // YYYY-MM-DD format
  subtotal: z.number(),
  iva: z.number(),
  total: z.number(),
});
```

---

## 3. Four Layers of Agent Resilience

### Layer 1: Parsing Resilience & Schema Normalization
When small vision models output conversational preambles or markdown fences, the heuristic parser extracts the outermost `{...}` JSON block, strips non-numeric currency symbols (`$`, `USD`, `COP`), and standardizes decimal and thousands delimiters.

### Layer 2: Deterministic Multi-Jurisdiction Tax Validation
- **Arithmetic Verification**: $\text{subtotal} + \text{iva} \equiv \text{total} \pm 2\text{ units}$.
- **Checksum Algorithms**: DIAN (Colombia) and ARCA/AFIP (Argentina) weighted Modulo 11 verification digits.
- **Valid VAT Schedules**: Jurisdiction-specific rates (Colombia: 19%, 5%, 0%; Argentina: 21%, 10.5%, 27%; Mexico: 16%, 8%).

### Layer 3: Multi-Transaction Split-Payment Matching
When an invoice is paid across multiple bank wire transfers (e.g. advance payment + delivery settlement), the matching algorithm evaluates transaction pairs within a $\pm3$ day window to match the total with zero human overhead.

### Layer 4: Uncertainty Quantification & 5-Second Escalation
The agent assigns a calibrated confidence score (0-100%) to each document based on OCR quality, arithmetic precision, tax ID validity, and bank matching. Anomalous or low-confidence invoices are routed to the **5-second human audit card** for instant operator resolution.
