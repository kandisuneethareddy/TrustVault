import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { initDatabase, closeDatabase } from '../src/db/database';
import { seed } from '../src/db/seed';
import { AuthService } from '../src/services/AuthService';
import { AuditLogService } from '../src/services/AuditLogService';

describe('Instant Revocation Invariant Verification', () => {
  let bobToken: string;    // Owner of Project Titan Spec
  let charlieToken: string; // Viewer
  const bobDocId = 'doc-titan-arch';

  beforeAll(async () => {
    await initDatabase();
    await seed();

    const bob = AuthService.getUserById('usr-bob-003')!;
    const charlie = AuthService.getUserById('usr-charlie-004')!;

    bobToken = AuthService.signToken({ id: bob.id, email: bob.email, role: bob.role, tokenVersion: 1 });
    charlieToken = AuthService.signToken({ id: charlie.id, email: charlie.email, role: charlie.role, tokenVersion: 1 });
  });

  afterAll(() => {
    closeDatabase();
  });

  it('REVOKE-01: Bob initially grants Charlie READ access to Project Titan Spec', async () => {
    // Before grant: Charlie cannot download
    const preCheck = await request(app)
      .get(`/api/documents/${bobDocId}/download`)
      .set('Authorization', `Bearer ${charlieToken}`);
    expect(preCheck.status).toBe(403);

    // Bob grants permission
    const grantRes = await request(app)
      .post(`/api/documents/${bobDocId}/permissions`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        targetUserId: 'usr-charlie-004',
        accessLevel: 'READ',
      });
    expect(grantRes.status).toBe(201);

    // Charlie can now download
    const downloadRes = await request(app)
      .get(`/api/documents/${bobDocId}/download`)
      .set('Authorization', `Bearer ${charlieToken}`);
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.text).toContain('PROJECT TITAN');
  });

  it('REVOKE-02: Bob revokes Charlie access; Charlie NEXT download fails IMMEDIATELY (403)', async () => {
    // Bob revokes access
    const revokeRes = await request(app)
      .delete(`/api/documents/${bobDocId}/permissions/usr-charlie-004`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.instantRevocation).toBe(true);

    // Charlie immediately attempts to download using his still-valid JWT session
    const immediateAttempt = await request(app)
      .get(`/api/documents/${bobDocId}/download`)
      .set('Authorization', `Bearer ${charlieToken}`);

    // MUST BE REFUSED IMMEDIATELY (Zero staleness window)
    expect(immediateAttempt.status).toBe(403);
    expect(immediateAttempt.body.error).toMatch(/Access denied/i);
  });

  it('REVOKE-03: The instant revocation is cryptographically recorded in the audit trail', async () => {
    const auditRes = AuditLogService.queryLogs({
      resourceId: bobDocId,
      action: 'PERMISSION_REVOKE',
    });

    expect(auditRes.total).toBeGreaterThanOrEqual(1);
    const revokeLog = auditRes.logs[0];
    expect(revokeLog.userEmail).toBe('bob@trustvault.corp');
    expect(revokeLog.status).toBe('SUCCESS');

    // Also verify that Charlie subsequent refused attempt was logged
    const refusedLogs = AuditLogService.queryLogs({
      resourceId: bobDocId,
      status: 'REFUSED',
      action: 'ACCESS_REFUSED',
    });
    expect(refusedLogs.total).toBeGreaterThanOrEqual(1);
  });

  it('REVOKE-04: Global session invalidation invalidates existing JWT instantly', async () => {
    // Charlie logs out or revokes all sessions
    const revokeSessionRes = await request(app)
      .post('/api/auth/revoke-sessions')
      .set('Authorization', `Bearer ${charlieToken}`);
    expect(revokeSessionRes.status).toBe(200);

    // Now, ANY call using the old charlieToken must fail with 401 SESSION_REVOKED
    const subsequentCall = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${charlieToken}`);

    expect(subsequentCall.status).toBe(401);
    expect(subsequentCall.body.code).toBe('SESSION_REVOKED');
  });
});

