import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { getDatabase } from '../db/database';
import { AuditLogService } from '../services/AuditLogService';

const router = Router();

// GET /api/admin/stats - Executive telemetry
router.get('/stats', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const db = getDatabase();

    const totalDocs = (db.prepare('SELECT COUNT(*) as count FROM documents').get() as any).count;
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const totalGrants = (db.prepare('SELECT COUNT(*) as count FROM permissions').get() as any).count;
    const totalRefused = (db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'REFUSED'").get() as any).count;
    const totalAuditBlocks = (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any).count;

    const classificationBreakdown = db.prepare(`
      SELECT classification, COUNT(*) as count FROM documents GROUP BY classification
    `).all();

    const categoryBreakdown = db.prepare(`
      SELECT category, COUNT(*) as count FROM documents GROUP BY category
    `).all();

    const integrity = AuditLogService.verifyLedgerIntegrity();

    res.json({
      metrics: {
        totalDocuments: totalDocs,
        totalUsers,
        activePermissionGrants: totalGrants,
        refusedBreachAttempts: totalRefused,
        totalAuditLedgerBlocks: totalAuditBlocks,
        ledgerIntegrityVerified: integrity.isValid,
        latestBlockHash: integrity.latestHash,
      },
      classifications: classificationBreakdown,
      categories: categoryBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/refused-attempts - Real-time security alerts
router.get('/refused-attempts', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM audit_logs
      WHERE status = 'REFUSED'
      ORDER BY sequence_number DESC
      LIMIT 100
    `).all() as any[];

    res.json({
      refusedAttempts: rows.map(r => ({
        id: r.id,
        sequenceNumber: r.sequence_number,
        timestamp: r.timestamp,
        userId: r.user_id,
        userEmail: r.user_email,
        userRole: r.user_role,
        action: r.action,
        resourceId: r.resource_id,
        reason: r.reason,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        metadata: r.metadata ? JSON.parse(r.metadata) : {},
        hash: r.hash,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

