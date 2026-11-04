import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authMiddleware';
import { DocumentService } from '../services/DocumentService';
import { CONFIG } from '../config';

const router = Router();

// Configure Multer with in-memory buffer storage
// Plaintext file NEVER touches the disk unencrypted!
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE_BYTES,
  },
});

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
}

// GET /api/documents - List documents
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = req.user!;
    const { search, category, ownerId, classification, startDate, endDate } = req.query;

    const docs = DocumentService.listDocuments({
      userId: user.id,
      userRole: user.role,
      search: search as string,
      category: category as string,
      ownerId: ownerId as string,
      classification: classification as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents - Upload & encrypt document
router.post('/', authenticateToken, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    if (user.role === 'viewer') {
      res.status(403).json({ error: 'Forbidden: Viewer accounts cannot upload documents. Owner or Admin role required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { title, description, category, classification } = req.body;
    if (!title || !category) {
      res.status(400).json({ error: 'Title and category are required' });
      return;
    }

    const doc = await DocumentService.uploadDocument({
      title,
      description,
      category,
      classification,
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      ownerId: user.id,
      ownerEmail: user.email,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(201).json({ document: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/documents/:id - Retrieve metadata
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await DocumentService.getDocument({
      documentId: docId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.json({ document: doc });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 403;
    res.status(status).json({ error: err.message });
  }
});

// GET /api/documents/:id/download - Stream decrypted file
router.get('/:id/download', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { fileBuffer, fileName, mimeType } = await DocumentService.downloadDocument({
      documentId: docId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.send(fileBuffer);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 403;
    res.status(status).json({ error: err.message });
  }
});

// GET /api/documents/:id/preview - In-browser decrypted preview
router.get('/:id/preview', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { fileBuffer, fileName, mimeType } = await DocumentService.previewDocument({
      documentId: docId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
    res.send(fileBuffer);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 403;
    res.status(status).json({ error: err.message });
  }
});

// PATCH /api/documents/:id - Update metadata (Requires EDIT or Owner)
router.patch('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description, category, classification } = req.body;
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const doc = await DocumentService.updateDocument({
      documentId: docId,
      title,
      description,
      category,
      classification,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.json({ document: doc });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 403;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/documents/:id - Delete document (Only Owner or Admin)
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await DocumentService.deleteDocument({
      documentId: docId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.json({ message: 'Document securely expunged and audit record created.' });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 403;
    res.status(status).json({ error: err.message });
  }
});

export default router;

