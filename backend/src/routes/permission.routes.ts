import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PermissionService } from '../services/PermissionService';

const router = Router();

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
}

// GET /api/documents/:id/permissions - List document permissions
router.get('/:id/permissions', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const permissions = await PermissionService.listPermissions({
      documentId: req.params.id,
      requestUserId: user.id,
      requestUserEmail: user.email,
      requestUserRole: user.role,
    });

    res.json({ permissions });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 403;
    res.status(status).json({ error: err.message });
  }
});

// POST /api/documents/:id/permissions - Grant named permission
router.post('/:id/permissions', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { targetUserId, accessLevel, validUntil } = req.body;

    if (!targetUserId || !accessLevel) {
      res.status(400).json({ error: 'targetUserId and accessLevel (READ or EDIT) are required' });
      return;
    }

    if (!['READ', 'EDIT'].includes(accessLevel)) {
      res.status(400).json({ error: 'accessLevel must be either READ or EDIT' });
      return;
    }

    const permission = await PermissionService.grantPermission({
      documentId: req.params.id,
      targetUserId,
      accessLevel,
      validUntil: validUntil || null,
      grantedByUserId: user.id,
      grantedByUserEmail: user.email,
      grantedByUserRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(201).json({ permission });
  } catch (err: any) {
    const status = err.message.includes('owner') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/documents/:id/permissions/:userId - Instant revocation
router.delete('/:id/permissions/:userId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    await PermissionService.revokePermission({
      documentId: req.params.id,
      targetUserId: req.params.userId,
      revokedByUserId: user.id,
      revokedByUserEmail: user.email,
      revokedByUserRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.json({
      message: 'Permission instantly revoked. All active authorizations have been terminated immediately.',
      instantRevocation: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const status = err.message.includes('owner') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

export default router;

