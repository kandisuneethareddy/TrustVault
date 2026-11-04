import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { initDatabase, closeDatabase, getDatabase } from '../src/db/database';
import { seed } from '../src/db/seed';
import { AuthService } from '../src/services/AuthService';
import { AuditLogService } from '../src/services/AuditLogService';

describe('AI Human-in-the-Loop Zero-Trust Safety Invariants', () => {
  let aliceToken: string; // Document Owner
  let eveToken: string;   // External untrusted
  const docId = 'doc-salary-2026';

  beforeAll(async () => {
    await initDatabase();
    await seed();

    const alice = AuthService.getUserById('usr-alice-002')!;
    const eve = AuthService.getUserById('usr-eve-006')!;

    aliceToken = AuthService.signToken({ id: alice.id, email: alice.email, role: alice.role, tokenVersion: 1 });
    eveToken = AuthService.signToken({ id: eve.id, email: eve.email, role: eve.role, tokenVersion: 1 });
  });

  afterAll(() => {
    closeDatabase();
  });

  it('AI-01: Non-owner (Eve) CANNOT request AI analysis for Alice’s document (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/ai/analyze/${docId}`)
      .set('Authorization', `Bearer ${eveToken}`);

    expect(res.status).toBe(403);
  });

  it('AI-02: AI generates advisory suggestion without modifying any database permissions (Safety Invariant)', async () => {
    const db = getDatabase();
    const permissionsBefore = db.prepare('SELECT COUNT(*) as count FROM permissions WHERE document_id = ?').get(docId) as any;

    const res = await request(app)
      .post(`/api/ai/analyze/${docId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.advisoryId).toBeDefined();
    expect(res.body.suggestedClassification).toBe('RESTRICTED');
    expect(res.body.riskIndicators.length).toBeGreaterThan(0);

    // CRITICAL SAFETY CHECK: Permissions in database MUST NOT have changed!
    const permissionsAfter = db.prepare('SELECT COUNT(*) as count FROM permissions WHERE document_id = ?').get(docId) as any;
    expect(permissionsAfter.count).toBe(permissionsBefore.count);

    // Audit log must reflect AI suggestion generation
    const auditRes = AuditLogService.queryLogs({ action: 'AI_CLASSIFICATION_REQUEST' });
    expect(auditRes.total).toBeGreaterThanOrEqual(1);
  });

  it('AI-03: Permissions are ONLY modified when human owner confirms review', async () => {
    // Generate new advisory
    const aiRes = await request(app)
      .post(`/api/ai/analyze/${docId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    const advisoryId = aiRes.body.advisoryId;

    // Human reviews and confirms
    const reviewRes = await request(app)
      .post('/api/ai/review')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        advisoryId,
        decision: 'CONFIRM',
        approvedGrants: [
          {
            userId: 'usr-dave-005',
            accessLevel: 'READ',
          },
        ],
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.status).toBe('CONFIRMED');

    // Dave now has permission because Alice confirmed
    const db = getDatabase();
    const daveGrant = db.prepare('SELECT * FROM permissions WHERE document_id = ? AND user_id = ?').get(docId, 'usr-dave-005');
    expect(daveGrant).toBeDefined();

    // Verify both AI suggestion and Human decision exist in audit trail
    const auditLogs = AuditLogService.queryLogs({ action: 'AI_CLASSIFICATION_REVIEWED' });
    expect(auditLogs.total).toBeGreaterThanOrEqual(1);
    expect(auditLogs.logs[0].metadata).toContain('CONFIRMED');
  });
});

