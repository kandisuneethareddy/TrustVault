import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { CONFIG } from './config';
import { initDatabase, getDatabase } from './db/database';
import { AuditLogService } from './services/AuditLogService';

import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import permissionRoutes from './routes/permission.routes';
import auditRoutes from './routes/audit.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: '*', // For hackathon testing, allow frontend and API callers
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (CONFIG.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiter for API defense
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});

// Strict limiter for authentication brute force defense
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 attempts per 15 min
  message: { error: 'Too many login attempts from this IP. Please try again after 15 minutes.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/documents', permissionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health & System Status Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const db = getDatabase();
  const integrity = AuditLogService.verifyLedgerIntegrity();

  res.json({
    status: 'ONLINE',
    service: 'TrustVault Zero-Trust Security Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'CONNECTED',
    auditLedger: {
      integrityVerified: integrity.isValid,
      totalChainedBlocks: integrity.totalRecords,
      latestHash: integrity.latestHash,
    },
  });
});

// Static frontend serving for production / standalone evaluation
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Handler for API
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint '${req.method} ${req.path}' not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(CONFIG.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Startup function
export async function startServer(port = CONFIG.PORT) {
  // Ensure DB and schema are initialized
  await initDatabase();

  const server = app.listen(port, () => {
    console.log(`🛡️  TrustVault Security Core running on port ${port}`);
    console.log(`📊 Health Endpoint: http://localhost:${port}/api/health`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

export default app;
