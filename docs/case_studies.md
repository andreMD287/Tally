# Operational Case Studies: Automated Reconciliation with Tally

This document details **four real-world operational case studies** resolved by Tally, demonstrating how an on-device local agent replaces manual review in accounting and treasury departments (Track 1).

---

## Case 1: Multi-Transaction Split Payment Reconciliation

### Scenario
An industrial supplier (`Refrigeracion Industrial S.A.S.`) issues invoice `A-0003` for **$2,449,020 COP** on `2026-08-19`. Due to corporate treasury cash flow rules, payment is executed in **two separate wire transfers**:
1. Transaction 1: `$1,500,000 COP` (Reference `TRX924508-A`, Date `2026-08-19`)
2. Transaction 2: `$949,020 COP` (Reference `TRX924508-B`, Date `2026-08-20`)

### Failure Mode in Traditional Software
Standard ERP matching tools only perform 1:1 exact sum matching. Because no single bank ledger line matches `$2,449,020`, the invoice is marked as "Unpaid / Unreconciled Exception", requiring a human accountant to manually search bank statements.

### Automated Resolution in Tally
1. **Multimodal Extraction**: SmolVLM2 extracts subtotal `$2,058,000`, VAT `$391,020`, and total `$2,449,020`.
2. **Tax Check**: Verifies `2,058,000 + 391,020 = 2,449,020` and validates the DIAN NIT `938617623-0`.
3. **Split-Match Algorithm ([`src/match/index.ts`](../src/match/index.ts))**: Detects that two bank lines within the $\pm3$ day window sum to `$2,449,020`.
4. **Outcome**: Automatically reconciled with classification `split` and confidence score `1.0` without human intervention.

---

## Case 2: Duplicate Invoice Fraud and Double-Billing Prevention

### Scenario
Vendor `Empaques Medellin S.A.S.` emails invoice `FAC-0001` (`$1,632,680 COP`) on August 11. One week later, the vendor collections desk re-sends the exact same document as a "Payment Reminder".

### Failure Mode in Traditional Software
Without strict pre-reconciliation deduplication, systems create a second accounts payable entry, creating a serious risk of accidental double payment.

### Automated Resolution in Tally
1. **Ingestion Deduplication ([`src/ingest/dedupe.ts`](../src/ingest/dedupe.ts))**: The pipeline indexes incoming items by `vendor + invoiceNumber + total` before ledger matching.
2. **Tally Action**: Discards the duplicate file, logs the event in [`out/discrepancias.md`](../out/discrepancias.md), and guarantees the bank statement is reconciled only once.
3. **Financial Protection**: Prevents a `$1,632,680 COP` loss from duplicate disbursement.

---

## Case 3: Vendor Arithmetic Calculation Error in Degraded Scan

### Scenario
Invoice `INV-0010` from `Empaques Medellin y CIA S. en C.` arrives as a low-quality scanned image (30% noise and shadow). The invoice also contains a **vendor calculation error**:
- Subtotal: `$254,000`
- VAT (19%): `$48,260` (Correct arithmetic sum: `$302,260`)
- Printed Total on Invoice: **`$302,281`** (Discrepancy: `$21 COP`).

### Automated Resolution and Triage in Tally
1. **Resilient Vision**: SmolVLM2 extracts numerical fields despite visual degradation.
2. **Arithmetic Guardrail**: Deterministic rules detect the `$21 COP` variance and flag validation status as `ERROR`.
3. **Honest Confidence Scoring**: Assigns **65% confidence** (*MEDIUM*), communicating uncertainty.
4. **5-Second Actionable Card**: The report outputs:
   > **5-Second Action**: *Request revised invoice from vendor or check for unitemized discount.*
5. **1-Click Audit**: The accountant opens `npm run audit`, reviews the delta, and flags the item with keypress `[O]` to notify procurement.

---

## Case 4: Tax ID Checksum Digit Inconsistency (Penalty Prevention)

### Scenario
Invoice `INV-0005` from `Distribuciones Cafetera y CIA S. en C.` displays printed NIT `964390161-0`.

### Failure Mode in Traditional Software
Standard OCR tools read text without verifying regulatory checksum validity. When tax filings are submitted, tax authorities (DIAN, SAT, AFIP) reject the return and issue compliance penalties.

### Automated Resolution in Tally
1. **Mathematical Checksum Validation ([`src/nit.ts`](../src/nit.ts))**: Tally computes the weighted Modulo 11 algorithm:
   $$\text{Expected Checksum} = f(\text{"964390161"}) = 8 \neq 0$$
2. **Instant Flag**: Categorized as `WARNING: Tax ID Checksum Inconsistency`.
3. **5-Second Action**: *Verify vendor tax ID record on official tax portal before recording tax credit deduction.*

---

## Performance Comparison Matrix

| Performance Metric | Traditional Manual Process | Cloud OCR API | Tally (Local QVAC Agent) |
| :--- | :--- | :--- | :--- |
| **Time per Invoice** | ~3 to 5 minutes | ~15 to 30 seconds | **< 1 second** |
| **Cost per Inference** | High (human labor hours) | $0.02 to $0.05 per doc | **$0.00 (100% Local)** |
| **Data Privacy** | Risk of human data leak | Documents sent to cloud servers | **100% On-Device Sovereignty** |
| **Split-Payment Matching** | Error-prone manual search | Rarely supported | **Automated (2-transaction pairs)** |
| **Uncertainty Calibration** | Subjective | Black-box output | **Calibrated Score (0-100%)** |
