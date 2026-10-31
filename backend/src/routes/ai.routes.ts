import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { AiPolicyService } from '../services/AiPolicyService';

const router = Router();

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
}

// POST /api/ai/analyze/:documentId - Generate AI advisory recommendations
router.post('/analyze/:documentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const result = await AiPolicyService.analyzeDocument({
      documentId: req.params.documentId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.json(result);
  } catch (err: any) {
    const status = err.message.includes('owner') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// POST /api/ai/review - Human confirms, modifies, or rejects advisory
router.post('/review', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { advisoryId, decision, approvedGrants, updatedClassification } = req.body;

    if (!advisoryId || !decision) {
      res.status(400).json({ error: 'advisoryId and decision (CONFIRM, REJECT, MODIFY) are required' });
      return;
    }

    if (!['CONFIRM', 'REJECT', 'MODIFY'].includes(decision)) {
      res.status(400).json({ error: 'decision must be CONFIRM, REJECT, or MODIFY' });
      return;
    }

    const result = await AiPolicyService.reviewAdvisory({
      advisoryId,
      decision,
      approvedGrants,
      updatedClassification,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.json(result);
  } catch (err: any) {
    const status = err.message.includes('owner') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

export default router;
