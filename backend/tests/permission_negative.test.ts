import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { initDatabase, closeDatabase, getDatabase } from '../src/db/database';
import { seed } from '../src/db/seed';
import { AuthService } from '../src/services/AuthService';
import { AuditLogService } from '../src/services/AuditLogService';

describe('Zero-Trust Negative Security Tests (RISE Specification)', () => {
  let aliceToken: string; // Document Owner
  let bobToken: string;   // Different Document Owner (has no access to Alice's doc)
  let charlieToken: string; // Viewer with READ access
  let eveToken: string;   // External Untrusted User (zero access)

  const aliceDocId = 'doc-salary-2026'; // Executive Compensation & Salary Matrix

  beforeAll(async () => {
    await initDatabase();
    await seed();

    // Generate tokens for test users
    const alice = AuthService.getUserById('usr-alice-002')!;
    const bob = AuthService.getUserById('usr-bob-003')!;
    const charlie = AuthService.getUserById('usr-charlie-004')!;
    const eve = AuthService.getUserById('usr-eve-006')!;

    aliceToken = AuthService.signToken({ id: alice.id, email: alice.email, role: alice.role, tokenVersion: 1 });
    bobToken = AuthService.signToken({ id: bob.id, email: bob.email, role: bob.role, tokenVersion: 1 });
    charlieToken = AuthService.signToken({ id: charlie.id, email: charlie.email, role: charlie.role, tokenVersion: 1 });
    eveToken = AuthService.signToken({ id: eve.id, email: eve.email, role: eve.role, tokenVersion: 1 });
  });

  afterAll(() => {
    closeDatabase();
  });

  it('SECURITY-01: Anonymous unauthenticated request cannot read document metadata (401)', async () => {
    const res = await request(app).get(`/api/documents/${aliceDocId}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('SECURITY-02: Anonymous unauthenticated request cannot download encrypted document (401)', async () => {
    const res = await request(app).get(`/api/documents/${aliceDocId}/download`);
    expect(res.status).toBe(401);
  });

  it('SECURITY-03: User B (Bob) CANNOT read Alice’s private document metadata (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${aliceDocId}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Access denied/i);
  });

  it('SECURITY-04: User B (Bob) CANNOT download Alice’s private document content (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${aliceDocId}/download`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Access denied/i);
  });

  it('SECURITY-05: External untrusted user (Eve) CANNOT download Alice’s document (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${aliceDocId}/download`)
      .set('Authorization', `Bearer ${eveToken}`);

    expect(res.status).toBe(403);
  });

  it('SECURITY-06: Refused attempts by Bob and Eve are permanently recorded in the audit trail', async () => {
    const auditRes = AuditLogService.queryLogs({
      resourceId: aliceDocId,
      status: 'REFUSED',
    });

    expect(auditRes.total).toBeGreaterThanOrEqual(2);
    const emails = auditRes.logs.map(l => l.userEmail);
    expect(emails).toContain('bob@trustvault.corp');
    expect(emails).toContain('eve@untrusted.org');

    // Verify cryptographic integrity of audit records
    const integrity = AuditLogService.verifyLedgerIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  it('SECURITY-07: Viewer (Charlie) with READ grant can read metadata and download', async () => {
    const metaRes = await request(app)
      .get(`/api/documents/${aliceDocId}`)
      .set('Authorization', `Bearer ${charlieToken}`);
    expect(metaRes.status).toBe(200);
    expect(metaRes.body.document.title).toContain('Executive Compensation');

    const downloadRes = await request(app)
      .get(`/api/documents/${aliceDocId}/download`)
      .set('Authorization', `Bearer ${charlieToken}`);
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.text).toContain('TRUSTVAULT CONFIDENTIAL - EXECUTIVE SALARY');
  });

  it('SECURITY-08: Viewer (Charlie) with READ grant CANNOT edit document metadata (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/documents/${aliceDocId}`)
      .set('Authorization', `Bearer ${charlieToken}`)
      .send({ title: 'Tampered Title by Charlie' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/EDIT privilege/i);
  });

  it('SECURITY-09: Viewer (Charlie) CANNOT delete Alice’s document (403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/documents/${aliceDocId}`)
      .set('Authorization', `Bearer ${charlieToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/owner/i);
  });

  it('SECURITY-10: Viewer (Charlie) CANNOT grant permissions to others (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/documents/${aliceDocId}/permissions`)
      .set('Authorization', `Bearer ${charlieToken}`)
      .send({
        targetUserId: 'usr-dave-005',
        accessLevel: 'READ',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/owner/i);
  });

  it('SECURITY-11: Document Owner (Alice) has full authorization for own document', async () => {
    const metaRes = await request(app)
      .get(`/api/documents/${aliceDocId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(metaRes.status).toBe(200);
    expect(metaRes.body.document.isOwner).toBe(true);
  });
});
