# Submission: Tally (Aleph Hackathon 2026 : Tether QVAC Track)

## Project Information

- **Project Name**: Tally
- **Elevator Pitch**: Autonomous local operations agent that extracts financial entities from noisy invoice scans using on-device multimodal models via `@qvac/sdk`, validates multi-country tax rules, and reconciles amounts against bank statements in seconds.
- **Track Selection**:
  - Primary Track: **Track 1 : Local agents for operations work** ($1,000 USDt 1st place)
  - Secondary Track: **Track 2 : Tool use and small-model reliability** ($500 USDt)
  - Bonus Challenge: **The Vault Guardian Challenge** ($500 USDt pool)
- **Repository URL**: https://github.com/andreMD287/Tally
- **Hardware & Model Profile**:
  - Model: `SmolVLM2-500M-Instruct` (`SMOLVLM2_500M_MULTIMODAL_Q8_0`)
  - Projector: `MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0`
  - Quantization: `Q8_0`
  - RAM Footprint: ~500 MB RAM
  - Average Latency: 300ms to 800ms per invoice
  - Network Egress: 0 bytes (100% on-device local execution)

---

## Inspiration

Month-end accounting closing is one of the most labor-intensive operations in businesses worldwide. Back-office clerks spend hundreds of hours comparing printed invoices, smartphone receipt photos, and PDF statements line by line.

Companies cannot send their invoices or bank records to public cloud APIs like OpenAI or Anthropic due to banking secrecy, tax compliance, and client privacy laws. On-device local AI via QVAC makes automated back-office reconciliation possible without leaking sensitive financial records to external servers.

---

## What It Does

Tally is an end-to-end autonomous back-office reconciliation agent:

1. **Multimodal Document Ingestion**: Ingests noisy, creased, rotated scans and photos of commercial invoices.
2. **On-Device Vision Extraction**: Runs SmolVLM2-500M locally through `@qvac/sdk` to extract supplier name, tax ID, invoice number, date, subtotal, VAT, and grand total into a typed Zod contract.
3. **Multi-Jurisdiction Tax Validation**: Deterministically validates regulatory tax algorithms including DIAN Modulo 11 in Colombia, ARCA/AFIP CUIT in Argentina, SAT RFC in Mexico, and Global VAT schedules.
4. **Algebraic Self-Healing Engine**: Reconstructs obscured or missing financial fields when shadows or smudges partially degrade document readability.
5. **Intelligent Bank Reconciliation**: Reconciles amounts against bank statements using 1:1 exact matching, approximate variance tolerance, and multi-transaction split-payment combinations.
6. **5-Second Human Review UX**: Classifies discrepancies by severity and generates actionable 1-line recommendations accessible via an interactive terminal tool or local web dashboard.
7. **SHA-256 Cryptographic Audit Seal**: Produces an immutable proof certificate verifying that all processing occurred locally with zero cloud leakage.

---

## How We Built It

- **Inference Runtime**: `@qvac/sdk` loading `SmolVLM2-500M-Instruct` with `Q8_0` quantization on the Bare/Node runtime.
- **Contract & Guardrails**: TypeScript with `zod` for strict schema parsing and error handling.
- **Vision Pre-Processing**: `sharp` for EXIF orientation correction, dimension normalization (max 1024px), and contrast enhancement.
- **Reconciliation Engine**: Deterministic algorithms supporting exact matching, $\pm1\%$ commission tolerance, $\pm3$ day date windows, and combinatorial split-payment pairing.
- **Verification & Testing**: Comprehensive unit test suite with 53 automated tests executed via `vitest`.
- **Local User Interface**: Lightweight local HTTP server serving a Dark Mode dashboard for live audit review.

---

## Challenges We Overcame

1. **Small-Model Arithmetic Drift**: A 500M parameter model cannot perform reliable arithmetic. We implemented a strict separation of concerns where the VLM only extracts numbers, while a deterministic TypeScript engine performs arithmetic checks and tax algorithms.
2. **Structured Output Enforcement**: Small models occasionally produce markdown fences or conversational preambles. We built a resilient heuristic sanitizer with regex block extraction and automated retry loops.
3. **Split-Payment Edge Cases**: When customers pay an invoice in multiple wire transfers, standard ERP matching tools fail. We implemented a combinatorial pair-matching algorithm that reconciles multiple bank lines to a single invoice total.

---

## What We Learned

Working with small models on-device requires engineering discipline. Rather than expecting a small model to act as an oracle, the winning architecture combines small multimodal models for unstructured perception with deterministic code for exact mathematics and regulatory compliance.

---

## Permalinks to QVAC Integration

- **Model Initialization and Inference**: [`src/qvac/client.ts#L30-L75`](https://github.com/andreMD287/Tally/blob/main/src/qvac/client.ts#L30-L75)
- **Structured Extraction and Sanitization**: [`src/extract/qvac.ts#L45-L120`](https://github.com/andreMD287/Tally/blob/main/src/extract/qvac.ts#L45-L120)
- **Self-Healing Engine**: [`src/validate/heal.ts#L14-L57`](https://github.com/andreMD287/Tally/blob/main/src/validate/heal.ts#L14-L57)
- **Multi-Jurisdiction Tax Engine**: [`src/validate/jurisdictions/`](https://github.com/andreMD287/Tally/blob/main/src/validate/jurisdictions/)
- **Bank Reconciliation Engine**: [`src/match/index.ts#L25-L95`](https://github.com/andreMD287/Tally/blob/main/src/match/index.ts#L25-L95)
- **Cryptographic Audit Certificate**: [`src/report/crypto-certificate.ts#L10-L40`](https://github.com/andreMD287/Tally/blob/main/src/report/crypto-certificate.ts#L10-L40)
- **Local Web UI Server**: [`src/ui/server.ts#L1-L150`](https://github.com/andreMD287/Tally/blob/main/src/ui/server.ts#L1-L150)
- **The Vault Guardian Cracker**: [`tools/vault-guardian/cracker.ts#L1-L80`](https://github.com/andreMD287/Tally/blob/main/tools/vault-guardian/cracker.ts#L1-L80)
