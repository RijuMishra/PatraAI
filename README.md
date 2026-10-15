# PatraAI (पत्रAI)
### Intelligent Document Verification & Transparent Decision Support

> **"Every document checked. Every decision explained."**

PatraAI is an enterprise SaaS application designed for scholarship administrations and educational loan providers. It bridges the trust and clarity gap between applicants submitting official credentials, verification officers evaluating documentary evidence, and administrators governing statutory policy rules.

---

## 🌟 The Five Questions PatraAI Answers

1. **Document Suitability:** Is the submitted document present, readable, and suitable for the required check?
2. **Data Consistency:** Does the information extracted from the document match the applicant's declared information?
3. **Policy Compliance:** Which eligibility rules passed, failed, or remain unresolved?
4. **Transparent Decisioning:** Why was a case approved, rejected, or referred for human review?
5. **Actionable Next Steps:** What should the applicant or reviewer do next?

---

## 🏛️ Core Architecture: Three Integrated Portals

PatraAI implements three dedicated portals within a single responsive web application and unified data model:

### 🎓 PORTAL A: APPLICANT / STUDENT
- **Page A1 — Applicant Dashboard:** Application status, progress tracker across 5 lifecycle stages, mandatory document checklist, declared profile overview, and recent notifications.
- **Page A2 — Scholarship Application Form:** Functional application with draft saving, field-level validation, statutory declarations, and policy benchmarks.
- **Page A3 — Document Upload Center:** Drag-and-drop file upload for Income Certificates, Marksheets, and ID proofs (PDF, JPG, PNG up to 5MB) with in-browser zoomable document preview, replace, and remove capabilities.
- **Page A4 — Document Verification Results:** Field-by-field provenance comparison between declared and extracted figures, highlighting discrepancies and plain-language status explanations.
- **Page A5 — Application Tracking:** Chronological audit timeline from draft creation to final decision with exact recorded timestamps.
- **Page A6 — Notifications & Decision:** In-app notification center and printable official transparent decision statement detailing explicit policy rules.

### 🔍 PORTAL B: VERIFICATION OFFICER
- **Page B1 — Review Dashboard:** Priority case queue displaying live computed statistics for mismatches, doc-deficient files, degraded scans, and urgent priorities.
- **Page B2 — Document Inspection Workspace:** Split-screen dual-pane workspace:
  - *Left Pane:* Original uploaded document with zoom, page navigation, 90° rotation, and metadata.
  - *Right Pane:* Extracted fields, declared baseline, manual officer overrides, and manual verification actions (*Mark Readable, Mark Unreadable, Mark Field Verified, Flag Mismatch, Request Correction, Unable to Verify*).
- **Page B3 — Contradiction Radar:** Normalizes currency and percentage values to detect discrepancies (e.g. Declared ₹2,40,000 vs Extracted ₹4,20,000) and automatically pauses approval. Emphasizes that discrepancy is not proof of fraud.
- **Page B4 — Evidence Passport:** Granular field-level verification record tracking the **6 discrete, non-conflated dimensions**:
  1. *Readable* (legible optical quality)
  2. *Extracted* (parsed into schema)
  3. *Consistent* (matches application declaration)
  4. *Policy Satisfied* (meets thresholds)
  5. *External Verified* (checked against registry)
  6. *Authenticity Established* (cryptographically certified)
- **Page B5 — Decision & Rule Trace:** Deterministic rule execution trace with actual evaluated inputs, condition thresholds, PASS/FAIL statuses, and evidence references.
- **Page B6 — Human Review & Final Decision:** Human officer determination (*Approve, Reject, Request Info, Escalate*) with closure gating that prevents approving cases with active discrepancies unless an explicit statutory hardship exception is recorded. Preserves the original automated recommendation.

### 🛡️ PORTAL C: SYSTEM ADMINISTRATOR
- **Page C1 — Operations Dashboard:** Computed operational KPIs, document defect root-cause distribution, turnaround durations, and reviewer workloads.
- **Page C2 — Policy Management:** Parameterized policy threshold editor (e.g. Max Income ₹3.5L, Min Academic Score 70%, Comparison Tolerance 2%) with simulated impact analysis across test cases. Sensitive demographic attributes are strictly locked out of eligibility rules.
- **Page C3 — Audit Trail (Append-Only):** Chronological compliance ledger tracking all actions with actor, reason, timestamp, and policy version.
- **Page C4 — Fairness & Quality Lab:** Automated test runner executing the 8 required test scenarios, including demographic invariance verification across paired synthetic profiles.
- **Page C5 — System Health & Security:** Adapter diagnostic telemetry and production gap analysis.

---

## ⚙️ Deterministic Decision Engine (Precedence Order)

The PatraAI policy engine evaluates cases using strict hierarchical precedence:

```
Step 1: Input Validity Check
  └── Invalid numeric ranges (e.g. Marks > 100% or Income < 0) ──> VALIDATION_ERROR / ACTION_REQUIRED

Step 2: Document Completeness & Readability
  └── Missing mandatory documents or degraded/unreadable scans ──> NEEDS_REVIEW

Step 3: Contradiction Check
  └── Active unclarified mismatch between declared & extracted data ──> NEEDS_REVIEW (Approval Locked)

Step 4: Eligibility Criteria Check
  └── Mandatory threshold failure with 100% complete evidence ──> REJECT recommendation
  └── All mandatory rules pass with 100% consistent evidence ──> APPROVE recommendation

Step 5: Ambiguity Fallback
  └── Any unresolved edge case ──> NEEDS_REVIEW
```

---

## 🧪 Automated Test Suite (Section 13)

PatraAI includes automated verification tests for all 8 required scenarios:

| Test ID | Test Scenario | Expected Outcome | Actual Result | Status |
|---|---|---|---|---|
| **TC-01** | Complete, consistent, eligible application (`APP-2026-0891`) | `APPROVE` | `APPROVE` (Completeness 100%) | **PASS** |
| **TC-02** | Missing required document (Marksheet omitted, `APP-2026-0892`) | `NEEDS_REVIEW` | `NEEDS_REVIEW` | **PASS** |
| **TC-03** | Declared income differs from document value (`APP-2026-0893`, ₹2.4L vs ₹4.2L) | `NEEDS_REVIEW` | `NEEDS_REVIEW` (Approval Interlocked) | **PASS** |
| **TC-04** | Academic score exceeds valid range (105%, `APP-2026-0894`) | `VALIDATION_ERROR` | `VALIDATION_ERROR` | **PASS** |
| **TC-05** | Mandatory eligibility condition fails (Marks 54.2% < 70%, `APP-2026-0895`) | `REJECT` | `REJECT` | **PASS** |
| **TC-06** | Human reviewer records final decision with override (`APP-2026-0896`) | Original `REJECT` Preserved | Original `REJECT` Preserved | **PASS** |
| **TC-07** | Paired synthetic records differing only in excluded sensitive demographics (`APP-2026-0897A/B`) | 100% Invariant Trace | Identical Rules & Recommendation | **PASS** |
| **TC-08** | Degraded / unreadable document scan fallback (`APP-2026-0898`) | Safe Manual Fallback | `NEEDS_REVIEW` (Manual Workspace) | **PASS** |

**Execution Result:** **8 PASSED, 0 FAILED** (100% Pass Rate).

---

## 🚀 Quickstart & Startup Instructions

### 1. Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### 2. Run Locally in Development Mode
```bash
# Clone or navigate to PatraAI directory
cd PatraAI

# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev
```
The application will be live at: **`http://localhost:5173/`**

### 3. Production Build
```bash
npm run build
npm run preview
```

### 4. Execute Automated CLI Tests
```bash
node test-cases-cli.js
```

---

## 🔒 Production Readiness & Gap Analysis

| Dimension | Prototype Implementation | Production Enterprise Requirement |
|---|---|---|
| **Authentication** | Client-side role selector with explicit demo labeling | OAuth 2.0 / OIDC with signed JWTs and backend RBAC |
| **Document Storage** | In-memory Blob URLs with ephemeral local cache | Encrypted S3 / GCS buckets with pre-signed URLs and automated retention/purge |
| **OCR Extraction** | High-fidelity synthetic fixture adapter with confidence scores | Google Gemini 1.5 Pro / Vision API endpoint integration |
| **Audit Log** | In-memory append-only array with JSON export | Immutable write-once-read-many (WORM) database with cryptographic hash chaining |
| **Tamper Resistance** | Clear client-side disclaimer | Server-side cryptographic signature on all issued determinations |
