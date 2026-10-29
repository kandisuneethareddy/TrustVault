import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, closeDatabase, getDatabase } from '../src/db/database';
import { seed } from '../src/db/seed';
import { AuditLogService } from '../src/services/AuditLogService';

describe('Audit Ledger Cryptographic Integrity & Tamper Evidence', () => {
  beforeAll(async () => {
    await initDatabase();
    await seed();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('AUDIT-01: Seeded audit ledger passes complete SHA-256 cryptographic chain verification', () => {
    const verification = AuditLogService.verifyLedgerIntegrity();
    expect(verification.isValid).toBe(true);
    expect(verification.totalRecords).toBeGreaterThan(0);
    expect(verification.latestHash).toBeTruthy();
    expect(verification.corruptedBlock).toBeUndefined();
  });

  it('AUDIT-02: Direct database tampering of an audit record is immediately detected', () => {
    const db = getDatabase();
    const targetBlock = 4;

    // Simulate attacker directly altering a database row (bypassing application layer)
    db.prepare('UPDATE audit_logs SET action = ? WHERE sequence_number = ?').run(
      'FORGED_UNAUTHORIZED_ACTION',
      targetBlock
    );

    // Run cryptographic verification
    const verification = AuditLogService.verifyLedgerIntegrity();

    expect(verification.isValid).toBe(false);
    expect(verification.corruptedBlock).toBeDefined();
    expect(verification.corruptedBlock?.sequenceNumber).toBe(targetBlock);
    expect(verification.corruptedBlock?.reason).toMatch(/Content tampering detected/i);
  });

  it('AUDIT-03: Breaking previous_hash linkage in chain is immediately detected', async () => {
    // Re-seed to clean state
    await seed();

    const db = getDatabase();
    const targetBlock = 5;

    // Simulate attacker attempting to splice or replace previous_hash
    db.prepare('UPDATE audit_logs SET previous_hash = ? WHERE sequence_number = ?').run(
      'deadbeef00000000000000000000000000000000000000000000000000000000',
      targetBlock
    );

    const verification = AuditLogService.verifyLedgerIntegrity();
    expect(verification.isValid).toBe(false);
    expect(verification.corruptedBlock?.sequenceNumber).toBe(targetBlock);
    expect(verification.corruptedBlock?.reason).toMatch(/Broken chain link/i);
  });
});
