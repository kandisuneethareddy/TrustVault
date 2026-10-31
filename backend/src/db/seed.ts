import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';
import { initDatabase, getDatabase } from './database';
import { AuditLogService } from '../services/AuditLogService';
import { StorageService } from '../services/StorageService';

async function seed(): Promise<void> {
  console.log('🚀 Initializing TrustVault Database Seed...');

  const db = await initDatabase();

  // Clean existing tables
  db.exec(`
    DELETE FROM ai_advisories;
    DELETE FROM audit_logs;
    DELETE FROM permissions;
    DELETE FROM documents;
    DELETE FROM users;
  `);

  console.log('✨ Cleared existing tables.');

  // Ensure vault storage directory exists
  if (!fs.existsSync(CONFIG.STORAGE_DIR)) {
    fs.mkdirSync(CONFIG.STORAGE_DIR, { recursive: true });
  }

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('TrustVault2026!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const alicePasswordHash = await bcrypt.hash('AlicePassword123!', 10);
  const bobPasswordHash = await bcrypt.hash('BobPassword123!', 10);
  const charliePasswordHash = await bcrypt.hash('CharliePassword123!', 10);
  const davePasswordHash = await bcrypt.hash('DavePassword123!', 10);
  const evePasswordHash = await bcrypt.hash('EvePassword123!', 10);

  const users = [
    {
      id: 'usr-admin-001',
      email: 'admin@trustvault.corp',
      passwordHash: adminPasswordHash,
      name: 'Arthur Vance (Global Compliance Officer)',
      role: 'admin',
      department: 'Executive Compliance',
    },
    {
      id: 'usr-alice-002',
      email: 'alice@trustvault.corp',
      passwordHash: alicePasswordHash,
      name: 'Alice Chen (VP Finance & HR)',
      role: 'owner',
      department: 'Finance & HR',
    },
    {
      id: 'usr-bob-003',
      email: 'bob@trustvault.corp',
      passwordHash: bobPasswordHash,
      name: 'Bob Martinez (Principal Architect)',
      role: 'owner',
      department: 'Engineering & R&D',
    },
    {
      id: 'usr-charlie-004',
      email: 'charlie@trustvault.corp',
      passwordHash: charliePasswordHash,
      name: 'Charlie Davis (Senior Legal Counsel)',
      role: 'viewer',
      department: 'Legal Counsel',
    },
    {
      id: 'usr-dave-005',
      email: 'dave@trustvault.corp',
      passwordHash: davePasswordHash,
      name: 'Dave Wilson (Operations Specialist)',
      role: 'viewer',
      department: 'Operations',
    },
    {
      id: 'usr-eve-006',
      email: 'eve@untrusted.org',
      passwordHash: evePasswordHash,
      name: 'Eve Adams (External Untrusted Entity)',
      role: 'viewer',
      department: 'External',
    },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, department, token_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  for (const u of users) {
    insertUser.run(u.id, u.email, u.passwordHash, u.name, u.role, u.department);
    AuditLogService.record({
      userId: u.id,
      userEmail: u.email,
      userRole: u.role,
      action: 'AUTH_REGISTER',
      resourceId: u.id,
      resourceType: 'USER',
      status: 'SUCCESS',
      metadata: { department: u.department, seeded: true },
    });
  }

  console.log(`👤 Seeded ${users.length} enterprise users across Admin, Owner, and Viewer roles.`);

  // 2. Seed Documents (with real AES-256-GCM encryption at rest)
  const docsData = [
    {
      id: 'doc-salary-2026',
      title: 'Executive Compensation & Salary Matrix 2026',
      description: 'Strictly confidential salary band benchmarks, executive bonuses, and equity compensation tables.',
      category: 'Human Resources',
      originalName: 'Executive_Salary_Matrix_2026.txt',
      classification: 'RESTRICTED',
      ownerId: 'usr-alice-002',
      ownerEmail: 'alice@trustvault.corp',
      content: Buffer.from(
        'TRUSTVAULT CONFIDENTIAL - EXECUTIVE SALARY BAND 2026\n' +
        '====================================================\n' +
        'Chief Executive Officer: $450,000 base + 50% target bonus\n' +
        'VP Finance (Alice Chen): $240,000 base + 30% target bonus\n' +
        'Principal Architect (Bob Martinez): $225,000 base + 25% target bonus\n' +
        'Senior Legal Counsel (Charlie Davis): $185,000 base + 20% target bonus\n' +
        'Unauthorized dissemination constitutes an immediate breach of fiduciary duty.\n',
        'utf-8'
      ),
    },
    {
      id: 'doc-titan-arch',
      title: 'Project Titan Core Architecture Specification',
      description: 'Proprietary distributed consensus algorithms, cryptographic key trees, and patent disclosures.',
      category: 'Engineering',
      originalName: 'Project_Titan_Specification.txt',
      classification: 'CONFIDENTIAL',
      ownerId: 'usr-bob-003',
      ownerEmail: 'bob@trustvault.corp',
      content: Buffer.from(
        'PROJECT TITAN - CONFIDENTIAL ENGINEERING ARCHITECTURE\n' +
        '=====================================================\n' +
        'Author: Bob Martinez, Principal Architect\n' +
        'Cryptographic Enclave: Hardware-accelerated Nitro Enclaves\n' +
        'Consensus: Raft with Merkle-tree state attestations\n' +
        'Internal patent filing: US-2026-TITAN-001\n',
        'utf-8'
      ),
    },
    {
      id: 'doc-snovasys-contract',
      title: 'Master Enterprise Agreement - Snovasys Hackathon 2026',
      description: 'Executed bilateral enterprise contract including intellectual property covenants and SLA guarantees.',
      category: 'Legal Contracts',
      originalName: 'Snovasys_Master_Agreement_2026.txt',
      classification: 'CONFIDENTIAL',
      ownerId: 'usr-alice-002',
      ownerEmail: 'alice@trustvault.corp',
      content: Buffer.from(
        'MASTER ENTERPRISE AGREEMENT - SNOVASYS & TRUSTVAULT\n' +
        '===================================================\n' +
        'Effective Date: November 2, 2026\n' +
        'Jurisdiction: Delaware / United Kingdom\n' +
        'Scope: 7-day secure document sharing with tamper-evident audit ledger\n' +
        'Signatories: Alice Chen (VP Finance), Arthur Vance (Compliance Officer)\n',
        'utf-8'
      ),
    },
    {
      id: 'doc-regulator-audit',
      title: 'Regulator Compliance & Security Audit Findings Q4-2025',
      description: 'Third-party SOC2 Type II and ISO 27001 statutory assessment reports and corrective action plan.',
      category: 'Compliance',
      originalName: 'Regulator_Audit_Report_Q4.txt',
      classification: 'RESTRICTED',
      ownerId: 'usr-alice-002',
      ownerEmail: 'alice@trustvault.corp',
      content: Buffer.from(
        'STATUTORY REGULATORY COMPLIANCE AUDIT REPORT Q4-2025\n' +
        '====================================================\n' +
        'Auditor: Sovereign Assurance LLP\n' +
        'Finding TV-01: Zero-trust per-document authorization enforced.\n' +
        'Finding TV-02: Cryptographic hash chain guarantees non-repudiation.\n' +
        'Status: Fully Compliant. Recommendation: Zero deviations.\n',
        'utf-8'
      ),
    },
  ];

  for (const doc of docsData) {
    const stored = await StorageService.encryptAndStore(doc.content);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO documents (
        id, title, description, category, file_name, original_name,
        mime_type, file_size, storage_key, checksum_sha256,
        encryption_iv, encryption_tag, owner_id, classification,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc.id,
      doc.title,
      doc.description,
      doc.category,
      doc.originalName,
      doc.originalName,
      'text/plain',
      stored.fileSize,
      stored.storageKey,
      stored.checksumSha256,
      stored.encryptionIv,
      stored.encryptionTag,
      doc.ownerId,
      doc.classification,
      now,
      now
    );

    AuditLogService.record({
      userId: doc.ownerId,
      userEmail: doc.ownerEmail,
      userRole: 'owner',
      action: 'DOCUMENT_UPLOAD',
      resourceId: doc.id,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      metadata: {
        title: doc.title,
        category: doc.category,
        classification: doc.classification,
        checksumSha256: stored.checksumSha256,
      },
    });
  }

  console.log(`📄 Seeded ${docsData.length} encrypted documents at rest (AES-256-GCM).`);

  // 3. Seed Named Permission Grants
  // Document 1 (Salary Matrix): Alice grants READ to Charlie Davis
  // Document 3 (Snovasys Contract): Alice grants EDIT to Charlie Davis
  // Document 4 (Regulator Audit): Alice grants READ to Dave Wilson
  // Notice: Bob Martinez does NOT have access to Alice's salary document!
  // Eve Adams has NO access to ANY document!
  const permissionsData = [
    {
      id: 'prm-001',
      documentId: 'doc-salary-2026',
      userId: 'usr-charlie-004',
      userEmail: 'charlie@trustvault.corp',
      accessLevel: 'READ',
      grantedBy: 'usr-alice-002',
      grantedByEmail: 'alice@trustvault.corp',
    },
    {
      id: 'prm-002',
      documentId: 'doc-snovasys-contract',
      userId: 'usr-charlie-004',
      userEmail: 'charlie@trustvault.corp',
      accessLevel: 'EDIT',
      grantedBy: 'usr-alice-002',
      grantedByEmail: 'alice@trustvault.corp',
    },
    {
      id: 'prm-003',
      documentId: 'doc-regulator-audit',
      userId: 'usr-dave-005',
      userEmail: 'dave@trustvault.corp',
      accessLevel: 'READ',
      grantedBy: 'usr-alice-002',
      grantedByEmail: 'alice@trustvault.corp',
    },
  ];

  for (const p of permissionsData) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO permissions (
        id, document_id, user_id, access_level, granted_by,
        valid_from, valid_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `).run(p.id, p.documentId, p.userId, p.accessLevel, p.grantedBy, now, now, now);

    AuditLogService.record({
      userId: p.grantedBy,
      userEmail: p.grantedByEmail,
      userRole: 'owner',
      action: 'PERMISSION_GRANT',
      resourceId: p.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      metadata: {
        targetUserId: p.userId,
        targetUserEmail: p.userEmail,
        accessLevel: p.accessLevel,
      },
    });
  }

  console.log(`🔐 Seeded ${permissionsData.length} named user permission grants.`);

  // 4. Seed an Unauthorized Refused Attempt (to show in audit trail)
  AuditLogService.record({
    userId: 'usr-eve-006',
    userEmail: 'eve@untrusted.org',
    userRole: 'viewer',
    action: 'ACCESS_REFUSED',
    resourceId: 'doc-salary-2026',
    resourceType: 'DOCUMENT',
    status: 'REFUSED',
    reason: 'NO_PERMISSION_GRANT: User eve@untrusted.org has no active permission grant for document',
    ipAddress: '198.51.100.42',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AttackProbe/2.0',
    metadata: { attemptedAction: 'DOWNLOAD', note: 'Simulated unauthorized perimeter probe' },
  });

  // Verify Ledger
  const verification = AuditLogService.verifyLedgerIntegrity();
  console.log(`🛡️  Audit Ledger Hash Verification: ${verification.isValid ? 'PASSED (100% Intact)' : 'FAILED'}`);
  console.log(`🔗 Total Chained Blocks: ${verification.totalRecords}`);
  console.log(`💎 Latest Hash: ${verification.latestHash}`);
  console.log('✅ Seed complete!\n');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}

export { seed };
