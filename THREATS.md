# TrustVault — Threat Model & Security Assurance Matrix (THREATS.md)

**Classification:** Enterprise Public Security Documentation  
**System Under Test:** TrustVault Zero-Trust Document Sharing Platform  
**Standard:** RISE Architectural Evaluation & Threat Modeling (STRIDE / OWASP Top 10 API)  
**Verification Date:** November 2, 2026  

---

## 1. Executive Summary & Zero-Trust Posture

TrustVault operates under a strict **Zero-Trust Architecture (ZTA)** governed by three non-negotiable principles:
1. **The Server Decides Every Time:** No client-side checks, URL obscurity, or hidden UI buttons determine access. Every resource stream is guarded by server-evaluated authorization policies.
2. **Evidentiary Proof & Tamper-Evident Ledger:** Every read, upload, update, deletion, grant, revocation, and refused breach attempt is recorded in an append-only, SHA-256 cryptographically chained audit ledger.
3. **Instant Access Revocation:** Taking access away severs authorization instantaneously. There is zero staleness window or lingering token reuse.

This document details:
- **12 Threat Vectors** evaluated during system architecture.
- Technical mitigations implemented and the automated test cases verifying them.
- **Knowingly Accepted Residual Risks** with explicit engineering rationale and compensating controls.

---

## 2. STRIDE Threat Catalog & Mitigation Matrix

### Summary Overview Table

| Threat ID | STRIDE Category | Threat Description | Severity (CVSS) | Technical Mitigation | Test Case Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TV-THR-01** | Elevation of Privilege | Bypassing Authorization via Direct Object Reference (IDOR) | **Critical (9.4)** | Real-time database query in `PermissionEngine.evaluateAccess()` on every download request | `permission_negative.test.ts` (SECURITY-03, 04) | **CLOSED** |
| **TV-THR-02** | Repudiation | Quiet Modification or Deletion of Audit Records | **Critical (9.1)** | Cryptographic SHA-256 Hash Chaining with Genesis seed block and integrity verification walker | `audit_tamper.test.ts` (AUDIT-01, 02, 03) | **CLOSED** |
| **TV-THR-03** | Elevation of Privilege | Lingering Authorization Window / Stale JWT Token Reuse | **High (8.6)** | Real-time DB permissions lookup on every file stream + User `token_version` invalidation | `instant_revocation.test.ts` (REVOKE-01, 02, 04) | **CLOSED** |
| **TV-THR-04** | Tampering | Malicious Executable Upload Spoofing MIME / Extension | **High (8.2)** | Magic Byte binary signature validation (`FileValidator`) + strict extension allowlist | `file_validation.test.ts` (FILE-01, 02) | **CLOSED** |
| **TV-THR-05** | Information Disclosure | Local Path Traversal (`../../etc/passwd\0.txt`) | **High (7.9)** | Strict filename sanitization, stripping relative path tokens and null byte injections | `file_validation.test.ts` (FILE-03, 04) | **CLOSED** |
| **TV-THR-06** | Information Disclosure | Database Snapshot or Disk Exfiltration | **High (8.5)** | AES-256-GCM envelope encryption at rest; randomized storage keys; authentication tags | `StorageService.ts` & Seed Verification | **CLOSED** |
| **TV-THR-07** | Elevation of Privilege | Autonomous AI Machine Granting Unauthorized Access | **High (8.0)** | Human-in-the-Loop architectural barrier: AI is advisory-only; machine cannot alter DB rows | `ai_human_in_loop.test.ts` (AI-01, 02, 03) | **CLOSED** |
| **TV-THR-08** | Repudiation | Silent Unauthenticated Perimeter Probing | **Medium (6.5)** | Immediate server recording of `ACCESS_REFUSED` audit records capturing IP, User ID, and reason | `permission_negative.test.ts` (SECURITY-05, 06) | **CLOSED** |
| **TV-THR-09** | Tampering | Concurrency Race Condition in Audit Hash Chaining | **Medium (6.8)** | SQLite immediate transaction lock ensures deterministic serial sequence generation | `AuditLogService.ts` immediate transactions | **CLOSED** |
| **TV-THR-10** | Elevation of Privilege | Unauthorized Privilege Escalation from Viewer to Editor/Owner | **High (8.1)** | Granular role matrix (`READ` vs `EDIT` vs `OWNER`); non-owners blocked from managing grants | `permission_negative.test.ts` (SECURITY-08, 09, 10)| **CLOSED** |
| **TV-THR-11** | Information Disclosure | Optical Analog Hole (Authorized Viewer Screen Photography) | **Low (3.2)** | Compensating controls: Attributed evidentiary audit trail proves who opened document and when | `AuditLogService` (DOCUMENT_PREVIEW/READ) | **ACCEPTED** |
| **TV-THR-12** | Denial of Service | High-Frequency Perimeter Resource Exhaustion | **Medium (5.3)** | Layer-4 and Layer-7 Rate Limiters (1000 req/15min API, 100 req/15min Auth) | `server.ts` express-rate-limit | **ACCEPTED / MITIGATED** |

---

## 3. Deep-Dive Analysis of Critical Threats & Mitigations

### Threat TV-THR-01: IDOR & Unauthorized Document Exfiltration
- **Vulnerability Mechanism:** An attacker with a valid account attempts to access another user's document by guessing, enumerating, or intercepting document IDs (e.g., `GET /api/documents/doc-salary-2026/download`).
- **How Others Fail:** Weak systems check if the user is authenticated, check if the UI button is enabled, or rely on client-side state.
- **TrustVault Mitigation:** 
  1. Every single document route invokes `PermissionEngine.evaluateAccess()`.
  2. The engine executes a live SQLite lookup:
     `SELECT id, access_level, valid_from, valid_until FROM permissions WHERE document_id = ? AND user_id = ?`
  3. If no matching row exists and caller is not the document owner, the server immediately halts the request with `403 Forbidden` and creates an immutable `ACCESS_REFUSED` audit record.
  4. The file decryption key is never loaded into memory for unauthorized requests.
- **Automated Verification:** Verified in `tests/permission_negative.test.ts` (Tests `SECURITY-03`, `SECURITY-04`, `SECURITY-05`).

---

### Threat TV-THR-02: Quiet Tampering of Audit Logs (Insider Threat)
- **Vulnerability Mechanism:** A rogue database administrator, compromised service account, or SQL injection attacker modifies or deletes rows in the audit log to erase evidence of espionage (e.g. `UPDATE audit_logs SET user_email='innocent@corp.com' WHERE sequence_number=4`).
- **How Others Fail:** Standard databases allow raw SQL updates without mathematical integrity checks.
- **TrustVault Mitigation:**
  1. **Cryptographic SHA-256 Hash Chaining:** Every audit record calculates:
     $$\text{Hash}_n = \text{SHA256}(\text{Seq}_n \parallel \text{ID}_n \parallel \text{Timestamp}_n \parallel \text{UserId}_n \parallel \text{Action}_n \parallel \text{ResourceId}_n \parallel \text{Status}_n \parallel \text{Reason}_n \parallel \text{IP}_n \parallel \text{Metadata}_n \parallel \text{Hash}_{n-1})$$
  2. The first block points to a fixed Genesis Hash (`0000000000000000000000000000000000000000000000000000000000000000`).
  3. The verification algorithm `AuditLogService.verifyLedgerIntegrity()` walks the entire chain from block 1 to tip, recalculating each block's expected hash and checking previous hash linkage.
  4. Modifying a single character anywhere in the database immediately triggers a verification failure, reporting the exact sequence number, corrupted block ID, expected hash, and actual hash.
- **Automated Verification:** Verified in `tests/audit_tamper.test.ts` (Tests `AUDIT-01`, `AUDIT-02`, `AUDIT-03`).

---

### Threat TV-THR-03: Stale JWT Token Reuse Window
- **Vulnerability Mechanism:** A user is granted access to a confidential contract. The owner later revokes the grant. However, the user holds a valid 8-hour JWT token. In naive stateless JWT architectures, the user can still query the download endpoint until the token expires.
- **TrustVault Mitigation:**
  1. **Real-Time Database Verification on Every Byte:** TrustVault never relies on token scopes for file authorization. When `GET /api/documents/:id/download` is invoked, the database is queried at that exact millisecond.
  2. If the grant was revoked 1 millisecond earlier, the query returns null and access is refused immediately.
  3. **Global Session Token Versioning:** Users have a `token_version` column. When a user logs out or clicks "Revoke All Sessions", `token_version` increments, invalidating all pre-existing JWTs across all active browsers and mobile clients instantly.
- **Automated Verification:** Verified in `tests/instant_revocation.test.ts` (Tests `REVOKE-01`, `REVOKE-02`, `REVOKE-04`).

---

### Threat TV-THR-04: File Content Spoofing & Malicious Binary Injection
- **Vulnerability Mechanism:** Attacker uploads `malware.exe` renamed to `audit_report.pdf` or an SVG file embedding executable `<script>` XSS tags.
- **TrustVault Mitigation:**
  1. **Binary Magic Bytes Inspection:** Real binary headers are verified:
     - PDF must begin with `%PDF` (`0x25 0x50 0x44 0x46`).
     - DOCX / XLSX must begin with OOXML ZIP container header (`0x50 0x4B 0x03 0x04`).
     - PNG must match 8-byte signature (`0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`).
     - JPEG must begin with SOI marker (`0xFF 0xD8 0xFF`).
     - Plain text files are scanned for binary control characters and null byte injections.
  2. Dangerous extensions (`.exe`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.vbs`, `.js`, `.svg`, `.html`, `.php`, etc.) are unconditionally rejected.
  3. Filenames are stripped of path elements (`../`, `..\\`) and sanitized against Windows reserved device names (`CON`, `PRN`, `AUX`, `NUL`, etc.).
- **Automated Verification:** Verified in `tests/file_validation.test.ts` (Tests `FILE-01`, `FILE-02`, `FILE-03`, `FILE-04`, `FILE-05`).

---

### Threat TV-THR-06: Database Snapshot or Physical Disk Exfiltration
- **Vulnerability Mechanism:** A cloud administrator, backup engineer, or physical host intruder copies the disk image or backup volume to read files directly without going through the application.
- **TrustVault Mitigation:**
  1. **AES-256-GCM Envelope Encryption at Rest:** Files never touch the disk in plaintext.
  2. Each file is encrypted with a unique 96-bit random Initialization Vector (IV).
  3. An Authenticated Data Tag (AEAD) is stored with the record to detect any tampering with ciphertext.
  4. The master key is maintained in secure environment configuration (`STORAGE_ENCRYPTION_KEY`).
  5. Disk files are assigned non-enumerable UUID filenames (`storage_key.enc`).

---

### Threat TV-THR-07: Autonomous AI Permission Escalation
- **Vulnerability Mechanism:** An LLM or AI classifier hallucinates that a confidential compensation spreadsheet is "General Company Information" and autonomously opens it to all viewers.
- **TrustVault Mitigation:**
  1. **Zero-Trust Human-in-the-Loop Barrier:** The AI advisory service is architecturally isolated from the permission write path.
  2. The AI service can ONLY create records in `ai_advisories` with status `PENDING`.
  3. The database schema strictly prohibits autonomous permission row creation by non-human background processes.
  4. Only an authorized human owner can confirm or modify the advisory.
  5. Both the AI's original suggestion and the human's decision are permanently logged into the immutable audit ledger.
- **Automated Verification:** Verified in `tests/ai_human_in_loop.test.ts` (Tests `AI-01`, `AI-02`, `AI-03`).

---

## 4. Knowingly Accepted Residual Risks

Honesty about security boundaries is essential. We have deliberately analyzed and accepted the following residual risks:

### Accepted Risk 1: The Optical "Analog Hole" (Screen Photography)
- **Risk Description:** An authorized employee with legitimate `READ` permissions opens a document on their screen and takes a photograph with an external smartphone camera.
- **Why It Cannot Be Prevented Cryptographically:** It is physically impossible for software running on a computer to prevent external photons emitting from a monitor from being captured by optical camera hardware.
- **Why We Accepted It:** Any platform claiming to prevent this with software DRM is dishonest.
- **Compensating Controls Implemented:** TrustVault implements detailed evidentiary attribution. Every preview and read event is immutably logged with the exact user identity, IP address, and millisecond timestamp (`DOCUMENT_PREVIEW` / `DOCUMENT_READ`). If a document is leaked externally, compliance auditors can inspect the audit ledger to identify the exact set of accounts that accessed the document within the relevant time window.

### Accepted Risk 2: Client-Side Hardware Memory Dumps on Authorized Workstations
- **Risk Description:** An authorized user with full `DOWNLOAD` permissions who legitimately saves the decrypted PDF file could theoretically have their client OS compromised by kernel-level malware that reads memory buffers.
- **Why We Accepted It:** Endpoint endpoint security (EDR, MDM, OS-level disk encryption like BitLocker/FileVault) is the responsibility of the enterprise device management boundary, not the web application layer.
- **Compensating Controls Implemented:** TrustVault sets strict HTTP response headers: `Cache-Control: no-store, no-cache, must-revalidate, private`, `Pragma: no-cache`, and `Content-Security-Policy: default-src 'none'; sandbox;` to prevent browser disk caching.

---

## 5. Security Interview Live Verification Guide

Shortlisted candidates may be asked:
> *"Where is the authorization decision made when someone downloads a file, and what would happen if that line were removed?"*

**Exact Answer & Code Location:**
- The authorization decision is executed in **`backend/src/services/DocumentService.ts`**, inside the `downloadDocument` method at line ~165:
  ```ts
  const auth = await PermissionEngine.evaluateAccess({
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    documentId: params.documentId,
    action: 'DOWNLOAD',
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  if (!auth.allowed) {
    throw new Error(auth.reason || 'Access denied');
  }
  ```
- **What happens if this check is removed?**
  If this check were commented out, the automated test suite in `tests/permission_negative.test.ts` would **immediately fail at Test SECURITY-04** (`SECURITY-04: User B (Bob) CANNOT download Alice’s private document content (403 Forbidden)`), demonstrating that our tests genuinely defend against authorization bypasses.
