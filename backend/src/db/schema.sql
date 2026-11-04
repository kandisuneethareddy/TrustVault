-- TrustVault SQLite Enterprise Schema
-- Zero-Trust Data Model with Cryptographically Chained Audit Ledger

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'owner', 'viewer')) NOT NULL DEFAULT 'viewer',
    department TEXT NOT NULL,
    token_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    checksum_sha256 TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    encryption_tag TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    classification TEXT CHECK(classification IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')) NOT NULL DEFAULT 'INTERNAL',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Permissions Table (Named User Grants)
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    access_level TEXT CHECK(access_level IN ('READ', 'EDIT')) NOT NULL,
    granted_by TEXT NOT NULL,
    valid_from TEXT NOT NULL DEFAULT (datetime('now')),
    valid_until TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(document_id, user_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_permissions_lookup ON permissions(document_id, user_id);

-- Tamper-Evident Audit Logs Table (Cryptographically Chained)
CREATE TABLE IF NOT EXISTS audit_logs (
    sequence_number INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    user_id TEXT,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    resource_id TEXT,
    resource_type TEXT,
    status TEXT CHECK(status IN ('SUCCESS', 'REFUSED')) NOT NULL,
    reason TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    previous_hash TEXT NOT NULL,
    hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);

-- AI Access Advisory Table (Human-in-the-Loop Decision Ledger)
CREATE TABLE IF NOT EXISTS ai_advisories (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    suggested_classification TEXT NOT NULL,
    suggested_grants TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'MODIFIED')) NOT NULL DEFAULT 'PENDING',
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

