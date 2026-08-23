# Demo Video Script (2 Minutes): Tally

> **Hackathon**: Aleph Hackathon 2026 (Tether QVAC Track)  
> **Duration**: 2 minutes (120 seconds)  
> **Objective**: Present Track 1 ($1,000 USDt), Track 2 ($500 USDt), and The Vault Guardian challenge.

---

## Second-by-Second Breakdown

### `0:00 - 0:25` : The Problem & On-Device Mandate
* **Visual**: Clean Tally terminal banner and a folder of messy receipt photos and skewed invoice scans (`data/facturas/`).
* **Spoken Script**:
  > "In finance and operations, month-end closing is a massive bottleneck. Accountants spend hours matching PDF invoices, phone receipt photos, and bank statements line by line.
  > Companies cannot send these documents to cloud AI APIs like OpenAI because of banking secrecy and strict tax privacy laws.
  > That is why we built Tally: an autonomous local operations agent that reconciles invoices against bank records entirely on-device using QVAC and SmolVLM2, running in only 500 MB of RAM with zero cloud calls."

---

### `0:25 - 1:00` : Live Execution & Local Web Dashboard
* **Visual**: Terminal executing `npm run client:demo`, then opening the browser to `http://localhost:3000`.
* **Spoken Script**:
  > "Here is Tally running on a real batch of supplier invoices. As the pipeline executes, the multimodal vision model SmolVLM2-500M extracts key financial entities directly from noisy, degraded images.
  > In our local web dashboard, the accountant immediately sees key operational metrics: reconciled totals, deductible VAT, and a SHA-256 cryptographic privacy seal proving mathematically that no financial data left the laptop."

---

### `1:00 - 1:40` : Hard Edge Cases & Small-Model Reliability (Track 2)
* **Visual**: Pointing to `out/discrepancies.md` and the dashboard triage table.
* **Spoken Script**:
  > "Small 500M models often stumble on arithmetic or tax rules. Tally solves this with a hybrid architecture:
  > First, Split Payments: When a \$3.2M invoice is paid in two separate bank wire transfers, the matching engine pairs them automatically.
  > Second, Multi-Jurisdiction Validation: It runs deterministic Modulo 11 checks for Colombia DIAN, Argentina ARCA/AFIP, and Mexico SAT.
  > Third, Self-Healing: If poor lighting obscures a subtotal, the agent algebraically reconstructs it from the total and tax rate, flagging it transparently for human review."

---

### `1:40 - 2:00` : 5-Second Human Audit & Conclusion
* **Visual**: Terminal running `npm run audit` resolving a flagged discrepancy with key `[A]`, followed by `npm run vault:crack`.
* **Spoken Script**:
  > "For any discrepancy, the operator resolves it in 5 seconds with a single keypress in our terminal tool.
  > We also include an automated prompt injection suite with five attack vectors for The Vault Guardian challenge.
  > Tally is private, deterministic, multi-country, and ready to automate edge financial operations. Thank you."
