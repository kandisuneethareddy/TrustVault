import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { AuditLogService } from '../services/AuditLogService';

const router = Router();

// GET /api/audit - Query audit logs
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = req.user!;
    const { userId, action, resourceId, status, search, limit, offset } = req.query;

    // Viewers cannot browse full audit trails, only their own activity
    const filterUserId = user.role === 'viewer' ? user.id : (userId as string);

    const result = AuditLogService.queryLogs({
      userId: filterUserId,
      action: action as string,
      resourceId: resourceId as string,
      status: status as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audit/verify - Cryptographically verify the entire audit ledger chain
router.get('/verify', authenticateToken, (req: Request, res: Response): void => {
  try {
    const verification = AuditLogService.verifyLedgerIntegrity();

    // Log the verification attempt itself
    AuditLogService.record({
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: 'AUDIT_VERIFY_INTEGRITY',
      resourceType: 'AUDIT_CHAIN',
      status: verification.isValid ? 'SUCCESS' : 'REFUSED',
      reason: verification.isValid ? 'Ledger verified 100% authentic' : 'Tamper detected during cryptographic walk',
      metadata: {
        totalBlocksWalked: verification.totalRecords,
        latestHash: verification.latestHash,
        corruptedBlock: verification.corruptedBlock,
      },
    });

    res.json({ verification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/audit/simulate-tamper - For hackathon judges to verify tamper-evidence
router.post('/simulate-tamper', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { sequenceNumber, maliciousAction } = req.body;
    if (!sequenceNumber) {
      res.status(400).json({ error: 'sequenceNumber is required to target a block' });
      return;
    }

    const action = maliciousAction || 'MALICIOUS_SQL_INJECTION_ALTERATION';
    AuditLogService.simulateTamper(parseInt(sequenceNumber, 10), action);

    // Now re-verify immediately to show the detection
    const verifyAfter = AuditLogService.verifyLedgerIntegrity();

    res.json({
      message: `Tamper simulation injected at block sequence #${sequenceNumber}. Database row was updated behind the scenes.`,
      tamperedBlockNumber: sequenceNumber,
      integrityCheckAfterAttack: verifyAfter,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audit/export - Export audit trail for external compliance
router.get('/export', authenticateToken, (req: Request, res: Response): void => {
  try {
    const format = (req.query.format as string) || 'json';
    const { logs } = AuditLogService.queryLogs({ limit: 1000 });

    if (format === 'csv') {
      const headers = ['sequenceNumber', 'timestamp', 'userEmail', 'userRole', 'action', 'resourceId', 'status', 'reason', 'ipAddress', 'hash'];
      const csvRows = [headers.join(',')];

      for (const log of logs) {
        csvRows.push([
          log.sequenceNumber,
          `"${log.timestamp}"`,
          `"${log.userEmail || ''}"`,
          `"${log.userRole || ''}"`,
          `"${log.action}"`,
          `"${log.resourceId || ''}"`,
          `"${log.status}"`,
          `"${(log.reason || '').replace(/"/g, '""')}"`,
          `"${log.ipAddress}"`,
          `"${log.hash}"`,
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="trustvault-audit-trail.csv"');
      res.send(csvRows.join('\n'));
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="trustvault-audit-trail.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      exportedBy: req.user?.email,
      totalRecords: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
