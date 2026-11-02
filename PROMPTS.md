# TrustVault — AI Interaction & Verification Journal (PROMPTS.md)

**Project:** TrustVault Zero-Trust Document Sharing Platform  
**Purpose:** Mandatory evidentiary log of AI usage, flaws caught, security corrections, and architectural steering across the development cycle.  
**Scoring Criteria:** Evidence of catching AI errors and subtle authorization/audit flaws (at least two entries focused on authorization/access control/audit trail).

---

## Reusable Context & System Instructions Used Across the Week

When directing AI tools during TrustVault development, the following system prompt and architectural guardrails were consistently prepended to ensure zero-trust compliance:

```text
[SYSTEM CONTEXT & SECURITY INVARIANTS]
You are assisting in building TrustVault, an enterprise-grade document sharing platform evaluated under adversarial attack.
The three non-negotiable standards:
1. Server Decides Every Time: Zero client-side authorization. Every endpoint querying documents must run live authorization checks.
2. Evidentiary Proof: Every access, download, grant, revocation, and refused attempt must be recorded in an immutable, cryptographically chained SHA-256 audit ledger.
3. Instant Revocation: Taking access away must take effect in 0 milliseconds.
Never propose or generate stateless token scopes for file downloads without live database checks. Never allow AI to modify permissions autonomously.
```

---

## Entry 1: Authorization Bypass via Stateless JWT Download URLs

- **Date:** October 28, 2026
- **Task / Prompt Summary:**  
  *"Design the file download endpoint for TrustVault. We want high-performance downloads. Can we issue signed download tokens so the storage server doesn't hit the database on every chunk?"*
- **What the Tool Produced:**  
  The AI suggested generating a 15-minute signed HMAC JWT containing `{ documentId, userId, access: 'READ' }` that the client could pass directly to `GET /api/documents/:id/download?token=...`. The proposed download handler only checked `jwt.verify(token, SECRET)` and streamed the file directly from storage without querying the database.
- **What Was Wrong With It (Specifically):**  
  **Catastrophic Violation of Requirement #3 (Instant Revocation).**  
  If Document Owner Alice revokes Viewer Charlie's access to `Executive_Salaries.pdf`, Charlie could still use his previously issued 15-minute download token to exfiltrate the file until token expiration. The server was NOT deciding at the time of download; the expired authorization state was frozen in the token.
- **What We Did Instead & Code Reference:**  
  We rejected stateless download tokens entirely. In [backend/src/services/PermissionEngine.ts](file:///backend/src/services/PermissionEngine.ts) and [backend/src/services/DocumentService.ts](file:///backend/src/services/DocumentService.ts), every single download request executes a live SQL query against the `permissions` table inside the request lifecycle:
  ```ts
  // Live database check guarantees 0ms staleness window
  const auth = await PermissionEngine.evaluateAccess({
    userId: params.userId,
    documentId: params.documentId,
    action: 'DOWNLOAD',
  });
  if (!auth.allowed) throw new Error(auth.reason);
  ```
  This is covered and verified by automated test `REVOKE-02` in `tests/instant_revocation.test.ts`.

---

## Entry 2: Cryptographic Audit Trail Concurrency Race Condition

- **Date:** October 29, 2026
- **Task / Prompt Summary:**  
  *"Implement the cryptographic hash chaining service for our audit log. Each record should hash the previous block's hash and the current payload."*
- **What the Tool Produced:**  
  The AI wrote an async function:
  ```ts
  const lastBlock = await db.query('SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1');
  const newHash = sha256(payload + lastBlock.hash);
  await db.query('INSERT INTO audit_logs ... VALUES (..., newHash)');
  ```
- **What Was Wrong With It (Specifically):**  
  **Race Condition Causing Ledger Forking & Chain Breakage.**  
  Under concurrent HTTP requests (e.g., two users downloading different documents simultaneously), both requests would read the same `lastBlock.hash`, compute their respective new hashes with the same parent, and insert them. This creates a fork in the blockchain-style ledger, making subsequent verification fail with a false "Broken Chain Link" error.
- **What We Did Instead & Code Reference:**  
  In [backend/src/services/AuditLogService.ts](file:///backend/src/services/AuditLogService.ts), we wrapped the sequence lookup, hash computation, and insertion inside an immediate SQLite transaction:
  ```ts
  const insertTransaction = db.transaction(() => {
    const lastBlock = db.prepare('SELECT sequence_number, hash FROM audit_logs ORDER BY sequence_number DESC LIMIT 1').get();
    const nextSequence = lastBlock ? lastBlock.sequence_number + 1 : 1;
    const previousHash = lastBlock ? lastBlock.hash : CONFIG.AUDIT_GENESIS_PREV_HASH;
    const hash = this.calculateHash({ sequenceNumber: nextSequence, ..., previousHash });
    db.prepare('INSERT INTO audit_logs ...').run({ sequenceNumber: nextSequence, ..., hash });
    return record;
  });
  return insertTransaction();
  ```
  This serializes ledger writes, guaranteeing that each block strictly depends on the immediately preceding block.

---

## Entry 3: Insecure File Validation via Extension & MIME Type Only

- **Date:** October 30, 2026
- **Task / Prompt Summary:**  
  *"Write a file upload validator middleware in Express to validate that uploaded files are only PDFs, DOCX, or images."*
- **What the Tool Produced:**  
  The AI produced a check checking `req.file.mimetype` and `path.extname(req.file.originalname)`. If `['application/pdf'].includes(file.mimetype)`, it accepted the file.
- **What Was Wrong With It (Specifically):**  
  **Trivial MIME Spoofing & Remote File Upload Vulnerability.**  
  `req.file.mimetype` is supplied by the client in the HTTP `Content-Type` multipart header. An attacker can upload an executable file (`payload.exe`), set the filename to `payload.pdf`, and set `Content-Type: application/pdf`. The AI's check would pass completely, storing an executable file on the server.
- **What We Did Instead & Code Reference:**  
  In [backend/src/services/FileValidator.ts](file:///backend/src/services/FileValidator.ts), we implemented **Magic Byte (Binary Signature) Inspection**:
  - Checks the first 4 bytes of the raw buffer for `%PDF-` (`0x25 0x50 0x44 0x46`).
  - Checks OOXML containers for PK ZIP header (`0x50 0x4B 0x03 0x04`).
  - Checks PNG 8-byte magic header (`0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`).
  - Checks JPEG SOI marker (`0xFF 0xD8 0xFF`).
  - Rejects text files with null byte injections (`\x00`).
  This is covered and verified by automated tests `FILE-01`, `FILE-02`, and `FILE-03` in `tests/file_validation.test.ts`.

---

## Entry 4: Autonomous AI Permission Granting (Human-in-the-Loop Violation)

- **Date:** October 31, 2026
- **Task / Prompt Summary:**  
  *"Build the AI access helper that analyzes document content and assigns permissions to recommended users based on department."*
- **What the Tool Produced:**  
  The AI produced a service that took a document, analyzed its category, called an LLM API, and directly executed:
  ```ts
  for (const recipient of suggestedRecipients) {
    db.prepare('INSERT INTO permissions VALUES (...)').run(...);
  }
  ```
  The AI's justification: *"This automates document sharing for the user."*
- **What Was Wrong With It (Specifically):**  
  **Catastrophic Violation of the RISE Hackathon Security Invariant: "The machine must never widen access on its own."**  
  Allowing an AI model to autonomously alter authorization tables introduces severe privilege elevation risks (hallucinations, prompt injection via uploaded document text, accidental de-compartmentalization of salary data).
- **What We Did Instead & Code Reference:**  
  In [backend/src/services/AiPolicyService.ts](file:///backend/src/services/AiPolicyService.ts), we designed a strict two-stage Human-in-the-Loop workflow:
  1. `analyzeDocument()` only creates an advisory record with `status: 'PENDING'`. It has zero access to the `permissions` table.
  2. The document owner must review the advisory in the UI and make an explicit decision (`CONFIRM`, `MODIFY`, `REJECT`).
  3. `reviewAdvisory()` applies grants ONLY after human confirmation, and records both the AI suggestion AND the human decision into the audit trail.
  This is verified by automated test `AI-02` in `tests/ai_human_in_loop.test.ts`.

---

## Entry 5: Missing Refusal Auditing (Silent Attack Probing)

- **Date:** November 1, 2026
- **Task / Prompt Summary:**  
  *"Implement authorization failure handling in PermissionEngine. If a user does not have permission, return false."*
- **What the Tool Produced:**  
  The AI returned:
  ```ts
  if (!permission) {
    return { allowed: false, reason: 'Access denied' };
  }
  ```
- **What Was Wrong With It (Specifically):**  
  **Evidentiary Failure on Security Probing.**  
  The prompt explicitly states: *"Two. You can prove who reached it. Afterwards, from the record, including the attempts that were refused. When a document leaks, the first question is always who opened this, and when."*  
  If the server only logs successful downloads, an adversary can probe 100 documents to map the vault, and the audit trail shows zero trace of their reconnaissance.
- **What We Did Instead & Code Reference:**  
  In [backend/src/services/PermissionEngine.ts](file:///backend/src/services/PermissionEngine.ts), we added automatic `ACCESS_REFUSED` audit recording on every denied access attempt:
  ```ts
  if (!permission) {
    this.logRefusal(params, 'NO_PERMISSION_GRANT', `User ${params.userEmail} has no active permission grant`);
    return { allowed: false, reason: 'Access denied' };
  }
  ```
  This logs the perpetrator's user ID, email, role, target document, IP address, and timestamp into the chained audit ledger, enabling real-time detection in the Admin Security Radar.
  This is verified by automated test `SECURITY-06` in `tests/permission_negative.test.ts`.
