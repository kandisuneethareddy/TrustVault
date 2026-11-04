import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { DocumentClassification, DocumentRecord, UserRole } from '../types';
import { AuditLogService } from './AuditLogService';
import { FileValidator } from './FileValidator';
import { PermissionEngine } from './PermissionEngine';
import { StorageService } from './StorageService';

export class DocumentService {
  /**
   * Uploads and stores a new encrypted document.
   */
  public static async uploadDocument(params: {
    title: string;
    description?: string;
    category: string;
    classification?: DocumentClassification;
    fileBuffer: Buffer;
    originalName: string;
    ownerId: string;
    ownerEmail: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DocumentRecord> {
    // 1. Validate file (magic bytes, dangerous extensions, size, sanitization)
    const validation = FileValidator.validateFile(params.originalName, params.fileBuffer);
    if (!validation.isValid) {
      AuditLogService.record({
        userId: params.ownerId,
        userEmail: params.ownerEmail,
        action: 'ACCESS_REFUSED',
        status: 'REFUSED',
        reason: `UPLOAD_VALIDATION_FAILED: ${validation.error}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: { originalName: params.originalName },
      });
      throw new Error(validation.error);
    }

    // 2. Encrypt and persist file to disk (AES-256-GCM)
    const stored = await StorageService.encryptAndStore(params.fileBuffer);

    // 3. Persist record in database
    const db = getDatabase();
    const docId = uuidv4();
    const now = new Date().toISOString();
    const classification = params.classification || 'INTERNAL';

    db.prepare(`
      INSERT INTO documents (
        id, title, description, category, file_name, original_name,
        mime_type, file_size, storage_key, checksum_sha256,
        encryption_iv, encryption_tag, owner_id, classification,
        created_at, updated_at
      ) VALUES (
        @id, @title, @description, @category, @fileName, @originalName,
        @mimeType, @fileSize, @storageKey, @checksumSha256,
        @encryptionIv, @encryptionTag, @ownerId, @classification,
        @createdAt, @updatedAt
      )
    `).run({
      id: docId,
      title: params.title.trim(),
      description: (params.description || '').trim(),
      category: params.category.trim(),
      fileName: validation.sanitizedName,
      originalName: params.originalName,
      mimeType: validation.detectedMimeType,
      fileSize: stored.fileSize,
      storageKey: stored.storageKey,
      checksumSha256: stored.checksumSha256,
      encryptionIv: stored.encryptionIv,
      encryptionTag: stored.encryptionTag,
      ownerId: params.ownerId,
      classification,
      createdAt: now,
      updatedAt: now,
    });

    const docRecord: DocumentRecord = {
      id: docId,
      title: params.title.trim(),
      description: params.description || '',
      category: params.category.trim(),
      fileName: validation.sanitizedName,
      originalName: params.originalName,
      mimeType: validation.detectedMimeType,
      fileSize: stored.fileSize,
      storageKey: stored.storageKey,
      checksumSha256: stored.checksumSha256,
      encryptionIv: stored.encryptionIv,
      encryptionTag: stored.encryptionTag,
      ownerId: params.ownerId,
      classification,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Record tamper-evident audit log
    AuditLogService.record({
      userId: params.ownerId,
      userEmail: params.ownerEmail,
      action: 'DOCUMENT_UPLOAD',
      resourceId: docId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        title: params.title,
        category: params.category,
        classification,
        fileSize: stored.fileSize,
        checksumSha256: stored.checksumSha256,
      },
    });

    return docRecord;
  }

  /**
   * Fetches document metadata with authorization check.
   */
  public static async getDocument(params: {
    documentId: string;
    userId: string;
    userEmail: string;
    userRole: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DocumentRecord & { accessLevel: string; isOwner: boolean }> {
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      documentId: params.documentId,
      action: 'READ',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error(auth.reason || 'Access denied');
    }

    const db = getDatabase();
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.documentId) as any;

    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'DOCUMENT_READ',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { title: doc.title },
    });

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      fileName: doc.file_name,
      originalName: doc.original_name,
      mimeType: doc.mime_type,
      fileSize: doc.file_size,
      storageKey: doc.storage_key,
      checksumSha256: doc.checksum_sha256,
      encryptionIv: doc.encryption_iv,
      encryptionTag: doc.encryption_tag,
      ownerId: doc.owner_id,
      classification: doc.classification,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      accessLevel: auth.grantedLevel || (auth.isOwner ? 'OWNER' : 'READ'),
      isOwner: !!auth.isOwner,
    };
  }

  /**
   * Downloads and decrypts document with real-time authorization check.
   */
  public static async downloadDocument(params: {
    documentId: string;
    userId: string;
    userEmail: string;
    userRole: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      documentId: params.documentId,
      action: 'DOWNLOAD',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error(auth.reason || 'Access denied');
    }

    const db = getDatabase();
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.documentId) as any;
    if (!doc) throw new Error('Document not found');

    const fileBuffer = await StorageService.retrieveAndDecrypt(
      doc.storage_key,
      doc.encryption_iv,
      doc.encryption_tag,
      doc.checksum_sha256
    );

    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'DOCUMENT_DOWNLOAD',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        fileName: doc.file_name,
        fileSize: doc.file_size,
        checksumSha256: doc.checksum_sha256,
      },
    });

    return {
      fileBuffer,
      fileName: doc.file_name,
      mimeType: doc.mime_type,
    };
  }

  /**
   * Previews document content (safe inline text or image preview) with real-time authorization check.
   */
  public static async previewDocument(params: {
    documentId: string;
    userId: string;
    userEmail: string;
    userRole: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      documentId: params.documentId,
      action: 'PREVIEW',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error(auth.reason || 'Access denied');
    }

    const db = getDatabase();
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.documentId) as any;
    if (!doc) throw new Error('Document not found');

    const fileBuffer = await StorageService.retrieveAndDecrypt(
      doc.storage_key,
      doc.encryption_iv,
      doc.encryption_tag,
      doc.checksum_sha256
    );

    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'DOCUMENT_PREVIEW',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { fileName: doc.file_name },
    });

    return {
      fileBuffer,
      fileName: doc.file_name,
      mimeType: doc.mime_type,
    };
  }

  /**
   * Updates document metadata (Requires EDIT access or Ownership).
   */
  public static async updateDocument(params: {
    documentId: string;
    title?: string;
    description?: string;
    category?: string;
    classification?: DocumentClassification;
    userId: string;
    userEmail: string;
    userRole: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DocumentRecord> {
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      documentId: params.documentId,
      action: 'EDIT',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error(auth.reason || 'Access denied: Requires EDIT privilege');
    }

    const db = getDatabase();
    const current = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.documentId) as any;
    if (!current) throw new Error('Document not found');

    const newTitle = params.title !== undefined ? params.title.trim() : current.title;
    const newDesc = params.description !== undefined ? params.description.trim() : current.description;
    const newCategory = params.category !== undefined ? params.category.trim() : current.category;
    const newClassification = params.classification || current.classification;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE documents
      SET title = ?, description = ?, category = ?, classification = ?, updated_at = ?
      WHERE id = ?
    `).run(newTitle, newDesc, newCategory, newClassification, now, params.documentId);

    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'DOCUMENT_UPDATE',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        previousTitle: current.title,
        newTitle,
        newClassification,
      },
    });

    return {
      id: current.id,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      fileName: current.file_name,
      originalName: current.original_name,
      mimeType: current.mime_type,
      fileSize: current.file_size,
      storageKey: current.storage_key,
      checksumSha256: current.checksum_sha256,
      encryptionIv: current.encryption_iv,
      encryptionTag: current.encryption_tag,
      ownerId: current.owner_id,
      classification: newClassification,
      createdAt: current.created_at,
      updatedAt: now,
    };
  }

  /**
   * Deletes document (Only Owner or Administrator).
   */
  public static async deleteDocument(params: {
    documentId: string;
    userId: string;
    userEmail: string;
    userRole: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      documentId: params.documentId,
      action: 'DELETE',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error(auth.reason || 'Access denied: Only document owner or administrator can delete');
    }

    const db = getDatabase();
    const doc = db.prepare('SELECT storage_key, title FROM documents WHERE id = ?').get(params.documentId) as any;
    if (!doc) throw new Error('Document not found');

    // Securely delete encrypted file
    await StorageService.removeFile(doc.storage_key);

    // Delete database records
    db.prepare('DELETE FROM documents WHERE id = ?').run(params.documentId);

    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'DOCUMENT_DELETE',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { title: doc.title },
    });
  }

  /**
   * Lists documents accessible by the user with comprehensive filters (name, category, owner, date).
   */
  public static listDocuments(params: {
    userId: string;
    userRole: UserRole;
    search?: string;
    category?: string;
    ownerId?: string;
    classification?: string;
    startDate?: string;
    endDate?: string;
  }): any[] {
    const db = getDatabase();

    let query: string;
    let queryParams: any = {};

    if (params.userRole === 'admin') {
      // Admin governance view: inspects all document records with owner info
      query = `
        SELECT d.*, u.name as owner_name, u.email as owner_email,
               'ADMIN_AUDIT' as access_level,
               (d.owner_id = @userId) as is_owner
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        WHERE 1=1
      `;
    } else {
      // Standard user view: Only documents owned by user OR explicitly granted to user
      query = `
        SELECT DISTINCT d.*, u.name as owner_name, u.email as owner_email,
               CASE 
                 WHEN d.owner_id = @userId THEN 'OWNER'
                 ELSE p.access_level
               END as access_level,
               (d.owner_id = @userId) as is_owner
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        LEFT JOIN permissions p ON d.id = p.document_id AND p.user_id = @userId
        WHERE (d.owner_id = @userId OR (p.id IS NOT NULL AND (p.valid_until IS NULL OR p.valid_until > datetime('now'))))
      `;
    }

    queryParams.userId = params.userId;

    if (params.search) {
      query += ' AND (d.title LIKE @search OR d.description LIKE @search OR d.file_name LIKE @search)';
      queryParams.search = `%${params.search}%`;
    }

    if (params.category) {
      query += ' AND d.category = @category';
      queryParams.category = params.category;
    }

    if (params.ownerId) {
      query += ' AND d.owner_id = @ownerId';
      queryParams.ownerId = params.ownerId;
    }

    if (params.classification) {
      query += ' AND d.classification = @classification';
      queryParams.classification = params.classification;
    }

    if (params.startDate) {
      query += ' AND d.created_at >= @startDate';
      queryParams.startDate = params.startDate;
    }

    if (params.endDate) {
      query += ' AND d.created_at <= @endDate';
      queryParams.endDate = params.endDate;
    }

    query += ' ORDER BY d.created_at DESC';

    const rows = db.prepare(query).all(queryParams) as any[];

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      fileName: r.file_name,
      originalName: r.original_name,
      mimeType: r.mime_type,
      fileSize: r.file_size,
      checksumSha256: r.checksum_sha256,
      ownerId: r.owner_id,
      ownerName: r.owner_name,
      ownerEmail: r.owner_email,
      classification: r.classification,
      accessLevel: r.access_level,
      isOwner: Boolean(r.is_owner),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }
}

