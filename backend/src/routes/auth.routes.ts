import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { AuthService } from '../services/AuthService';
import { getDatabase } from '../db/database';

const router = Router();

// Helper to get client IP
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role, department } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required.' });
      return;
    }

    const validRoles = ['admin', 'owner', 'viewer'];
    const chosenRole = validRoles.includes(role) ? role : 'viewer';

    const result = await AuthService.register({
      email,
      password,
      name,
      role: chosenRole,
      department: department || 'General',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = await AuthService.login({
      email,
      password,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = AuthService.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

// POST /api/auth/revoke-sessions
router.post('/revoke-sessions', authenticateToken, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  AuthService.revokeAllSessions(req.user.id);
  res.json({ message: 'All active sessions for this account have been instantly invalidated.' });
});

// GET /api/auth/users (for sharing dialog)
router.get('/users', authenticateToken, (req: Request, res: Response): void => {
  const users = AuthService.listUsers();
  res.json({ users });
});

// POST /api/auth/demo-switch (For quick role testing by hackathon judges)
router.post('/demo-switch', (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const db = getDatabase();
  const user = db.prepare('SELECT id, email, name, role, department, token_version, created_at FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    res.status(404).json({ error: `Demo account '${email}' not found. Please run seed script.` });
    return;
  }

  const token = AuthService.signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.token_version,
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      createdAt: user.created_at,
    },
    token,
  });
});

export default router;
