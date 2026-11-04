# TrustVault — Enterprise API Specification & RBAC Matrix

**Version:** 1.0.0  
**Security Standard:** Zero-Trust Architecture (ZTA)  
**Base URL:** `/api`  
**Authentication Scheme:** Bearer HTTP Authorization Header (`Authorization: Bearer <JWT>`) with live database `token_version` invalidation.

---

## 1. Role-Based Access Control (RBAC) Matrix

TrustVault enforces strict principle-of-least-privilege across three standard enterprise roles:
- **Administrator (`admin`)**: Compliance auditor and system operator. Can inspect cryptographic audit proofs, query telemetry, observe refused breach alerts, and invalidate user sessions. *Confidential document contents remain inaccessible without explicit owner grants.*
- **Document Owner (`owner`)**: Author/creator of confidential documents. Has full control over owned assets (`READ`, `PREVIEW`, `DOWNLOAD`, `EDIT`, `DELETE`, `MANAGE_PERMISSIONS`). Can grant and instantly revoke access to named users.
- **Authorized Viewer (`viewer`)**: Recipient with explicit named grants (`READ` or `EDIT`). Cannot delete documents, cannot alter permissions, and cannot reach ungranted assets.

### Comprehensive Endpoint Authorization Matrix

| HTTP Method | Endpoint | Description | Unauthenticated | Viewer | Document Owner | Administrator | Audit Action Recorded |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `POST` | `/api/auth/register` | Register new user account | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | `AUTH_REGISTER` |
| `POST` | `/api/auth/login` | Authenticate & issue token | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | `AUTH_LOGIN` / `ACCESS_REFUSED` |
| `GET` | `/api/auth/me` | Fetch authenticated identity | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | None |
| `POST` | `/api/auth/revoke-sessions` | Instantly revoke all active user JWTs | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | `AUTH_LOGOUT` |
| `GET` | `/api/auth/users` | List users for permission sharing | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | None |
| `POST` | `/api/auth/demo-switch` | Quick persona switcher for judges | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | None |
| `GET` | `/api/documents` | List reachable documents | ❌ 401 | ✅ Granted Only | ✅ Owned & Granted | ✅ All Metadata (Governance) | None |
| `POST` | `/api/documents` | Upload & encrypt document | ❌ 401 | ❌ 403 | ✅ Allowed | ✅ Allowed | `DOCUMENT_UPLOAD` |
| `GET` | `/api/documents/:id` | Read document metadata | ❌ 401 | ✅ If Granted | ✅ If Owner | ❌ 403 (unless granted) | `DOCUMENT_READ` / `ACCESS_REFUSED` |
| `GET` | `/api/documents/:id/download` | Decrypt & stream file payload | ❌ 401 | ✅ If Granted | ✅ If Owner | ❌ 403 (Zero-Trust partition) | `DOCUMENT_DOWNLOAD` / `ACCESS_REFUSED` |
| `GET` | `/api/documents/:id/preview` | In-browser safe decrypted preview | ❌ 401 | ✅ If Granted | ✅ If Owner | ❌ 403 (Zero-Trust partition) | `DOCUMENT_PREVIEW` / `ACCESS_REFUSED` |
| `PATCH` | `/api/documents/:id` | Update metadata (title, desc) | ❌ 401 | ✅ If EDIT Grant | ✅ If Owner | ❌ 403 | `DOCUMENT_UPDATE` / `ACCESS_REFUSED` |
| `DELETE` | `/api/documents/:id` | Permanently expunge document | ❌ 401 | ❌ 403 | ✅ If Owner | ✅ Allowed (Governance) | `DOCUMENT_DELETE` / `ACCESS_REFUSED` |
| `GET` | `/api/documents/:id/permissions`| List active named grants | ❌ 401 | ✅ If Granted | ✅ If Owner | ✅ Allowed | None |
| `POST` | `/api/documents/:id/permissions`| Grant access to named person | ❌ 401 | ❌ 403 | ✅ If Owner | ❌ 403 (Owner only) | `PERMISSION_GRANT` / `ACCESS_REFUSED` |
| `DELETE`| `/api/documents/:id/permissions/:userId` | Instantly revoke user access | ❌ 401 | ❌ 403 | ✅ If Owner | ✅ Allowed (Compliance) | `PERMISSION_REVOKE` |
| `POST` | `/api/ai/analyze/:documentId` | Generate AI advisory scan | ❌ 401 | ❌ 403 | ✅ If Owner | ❌ 403 | `AI_CLASSIFICATION_REQUEST` |
| `POST` | `/api/ai/review` | Human owner confirms/rejects AI | ❌ 401 | ❌ 403 | ✅ If Owner | ❌ 403 | `AI_CLASSIFICATION_REVIEWED` |
| `GET` | `/api/audit` | Query audit trail | ❌ 401 | ✅ Self Only | ✅ Owned Assets | ✅ Global Audit Access | None |
| `GET` | `/api/audit/verify` | Verify SHA-256 chain integrity | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | `AUDIT_VERIFY_INTEGRITY` |
| `POST` | `/api/audit/simulate-tamper` | Hackathon judge tamper demo | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | `SYSTEM_TAMPER_SIMULATION` |
| `GET` | `/api/audit/export` | Export CSV/JSON evidentiary trail | ❌ 401 | ❌ 403 | ✅ Allowed | ✅ Allowed | None |
| `GET` | `/api/admin/stats` | Executive telemetry metrics | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Admin Only | None |
| `GET` | `/api/admin/refused-attempts` | Live breach attempts feed | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Admin Only | None |

---

## 2. API Endpoints Reference

### 2.1 Authentication

#### `POST /api/auth/register`
Creates a new account.
- **Request Body:**
  ```json
  {
    "email": "sarah@trustvault.corp",
    "password": "SecurePassword123!",
    "name": "Sarah Connor",
    "role": "owner",
    "department": "Finance"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "user": {
      "id": "usr-uuid",
      "email": "sarah@trustvault.corp",
      "name": "Sarah Connor",
      "role": "owner",
      "department": "Finance",
      "createdAt": "2026-11-02T10:00:00.000Z"
    },
    "token": "eyJhbGciOi..."
  }
  ```

#### `POST /api/auth/login`
Authenticates with credentials and returns signed JWT with embedded `tokenVersion`.
- **Response `200 OK`:**
  ```json
  {
    "user": { "id": "...", "email": "...", "role": "owner" },
    "token": "eyJhbGciOi..."
  }
  ```
- **Response `401 Unauthorized`:** (Failure is permanently logged as `ACCESS_REFUSED` in audit ledger).

#### `POST /api/auth/revoke-sessions`
Instantly increments `token_version` in the database. All existing JWTs issued prior to this moment fail immediately across all active browser tabs and devices.

---

### 2.2 Documents

#### `POST /api/documents`
Uploads a document. Payload is validated against binary magic bytes in memory, encrypted with AES-256-GCM, and stored in vault storage.
- **Headers:** `Content-Type: multipart/form-data`
- **Fields:**
  - `file`: Binary file (PDF, DOCX, XLSX, PNG, JPG, CSV, TXT)
  - `title`: Document Title
  - `description`: Optional context
  - `category`: Classification Category
  - `classification`: `PUBLIC` | `INTERNAL` | `CONFIDENTIAL` | `RESTRICTED`
- **Response `201 Created`:**
  ```json
  {
    "document": {
      "id": "doc-uuid",
      "title": "Executive Salary Matrix 2026",
      "fileName": "Executive_Salary_Matrix.txt",
      "fileSize": 303,
      "classification": "RESTRICTED",
      "checksumSha256": "9d3bde0d...",
      "createdAt": "2026-11-02T10:05:00.000Z"
    }
  }
  ```

#### `GET /api/documents/:id/download`
Decrypts and streams file to authorized users.
- **Authorization Check:** Evaluated live on database `permissions` table.
- **Response `200 OK`:** Decrypted binary file stream with headers:
  - `Content-Disposition: attachment; filename="document.pdf"`
  - `Cache-Control: no-store, no-cache, must-revalidate, private`
  - `Pragma: no-cache`
- **Response `403 Forbidden`:** If user is not the owner and lacks active permission grant. Refusal recorded in immutable audit ledger.

---

### 2.3 Permissions & Instant Revocation

#### `POST /api/documents/:id/permissions`
Grants named user access. Only the document owner can grant permissions.
- **Request Body:**
  ```json
  {
    "targetUserId": "usr-charlie-004",
    "accessLevel": "READ",
    "validUntil": "2026-12-31T23:59:59Z"
  }
  ```

#### `DELETE /api/documents/:id/permissions/:userId`
**Instant Revocation Endpoint:** Immediately deletes permission row from SQLite.
- **Response `200 OK`:**
  ```json
  {
    "message": "Permission instantly revoked. All active authorizations have been terminated immediately.",
    "instantRevocation": true,
    "timestamp": "2026-11-02T10:15:00.000Z"
  }
  ```
- **Security Invariant:** The user's very next HTTP request to download or read this document will receive `403 Forbidden` within 0 milliseconds of this call completing.

---

### 2.4 Cryptographic Audit Ledger

#### `GET /api/audit/verify`
Walks all chained blocks from Genesis hash to latest block.
- **Response `200 OK`:**
  ```json
  {
    "verification": {
      "isValid": true,
      "totalRecords": 18,
      "genesisHash": "0000000000000000000000000000000000000000000000000000000000000000",
      "latestHash": "d5081e83125dec6dcc051fcbc4226f56bbaaff056aacf1b1e0c97bcf62620609"
    }
  }
  ```
- **If Tampered:** Returns `{ isValid: false, corruptedBlock: { sequenceNumber: 4, expectedHash: "...", actualHash: "..." } }`.

#### `POST /api/audit/simulate-tamper`
Utility for hackathon judges to verify tamper detection. Alters an arbitrary block in the database behind the server's back and immediately re-evaluates ledger integrity.

---

### 2.5 AI Policy Advisory (Human-in-the-Loop)

#### `POST /api/ai/analyze/:documentId`
Performs risk scanning (PII, IP, regulatory oversight). Generates advisory recommendation with status `PENDING`.
- **Safety Invariant:** Does NOT modify any permissions.

#### `POST /api/ai/review`
Human owner confirms, modifies, or rejects advisory recommendation.
- **Request Body:**
  ```json
  {
    "advisoryId": "adv-uuid",
    "decision": "CONFIRM",
    "approvedGrants": [
      { "userId": "usr-charlie-004", "accessLevel": "READ" }
    ]
  }
  ```
- **Evidentiary Output:** Logs both the AI suggestion and human decision into the immutable audit ledger.

