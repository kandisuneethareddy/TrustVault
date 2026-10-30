import { getDatabase } from '../db/database';
import { AccessLevel, AuditAction, UserRole } from '../types';
import { AuditLogService } from './AuditLogService';

export type RequiredAction = 'READ' | 'PREVIEW' | 'DOWNLOAD' | 'EDIT' | 'DELETE' | 'MANAGE_PERMISSIONS';

export interface EvaluationResult {
  allowed: boolean;
  reason?: string;
  isOwner?: boolean;
  grantedLevel?: AccessLevel;
}

export class PermissionEngine {
  /**
   * Centralized Zero-Trust Authorization Decider.
   * Runs directly against the live database state on EVERY request to ensure instant revocation.
   */
  public static async evaluateAccess(params: {
    userId: string;
    userEmail: string;
    userRole: UserRole;
    documentId: string;
    action: RequiredAction;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<EvaluationResult> {
    const db = getDatabase();

    // 1. Fetch document existence and ownership
    const doc = db.prepare('SELECT id, title, owner_id, classification FROM documents WHERE id = ?').get(params.documentId) as {
      id: string;
      title: string;
      owner_id: string;
      classification: string;
    } | undefined;

    if (!doc) {
      // Document does not exist or has been deleted
      this.logRefusal(params, 'DOCUMENT_NOT_FOUND', `Document with ID ${params.documentId} does not exist`);
      return { allowed: false, reason: 'Document not found' };
    }

    // 2. Document Owner has full authority
    if (doc.owner_id === params.userId) {
      return { allowed: true, isOwner: true, grantedLevel: 'EDIT' };
    }

    // 3. For DELETE or MANAGE_PERMISSIONS: only document owner (or admin override for governance) can perform
    if (params.action === 'DELETE') {
      if (params.userRole === 'admin') {
        // Admin governance deletion (audited)
        return { allowed: true, isOwner: false };
      }
      this.logRefusal(params, 'DELETE_DENIED', 'Only the document owner or compliance administrator can delete this document');
      return { allowed: false, reason: 'Forbidden: Insufficient ownership privilege' };
    }

    if (params.action === 'MANAGE_PERMISSIONS') {
      this.logRefusal(params, 'PERMISSION_MANAGEMENT_DENIED', 'Only the document owner can grant or revoke permissions');
      return { allowed: false, reason: 'Forbidden: Only the document owner can manage permissions' };
    }

    // 4. Check active named permission grant (Live DB Query for Instant Revocation)
    const permission = db.prepare(`
      SELECT id, access_level, valid_from, valid_until
      FROM permissions
      WHERE document_id = ? AND user_id = ?
    `).get(params.documentId, params.userId) as {
      id: string;
      access_level: AccessLevel;
      valid_from: string;
      valid_until: string | null;
    } | undefined;

    if (!permission) {
      this.logRefusal(
        params,
        'NO_PERMISSION_GRANT',
        `User ${params.userEmail} has no active permission grant for document '${doc.title}' (${doc.id})`
      );
      return { allowed: false, reason: 'Access denied: You have not been granted access to this document' };
    }

    // 5. Check time validity (instant revocation upon expiration)
    const now = new Date().toISOString();
    if (permission.valid_from > now) {
      this.logRefusal(params, 'PERMISSION_NOT_YET_ACTIVE', `Permission grant begins at ${permission.valid_from}`);
      return { allowed: false, reason: 'Permission grant is not yet active' };
    }

    if (permission.valid_until && permission.valid_until <= now) {
      this.logRefusal(params, 'PERMISSION_EXPIRED', `Permission grant expired at ${permission.valid_until}`);
      return { allowed: false, reason: 'Permission grant has expired' };
    }

    // 6. Action-specific authorization checks
    if (params.action === 'EDIT') {
      if (permission.access_level !== 'EDIT') {
        this.logRefusal(
          params,
          'INSUFFICIENT_ACCESS_LEVEL',
          `User holds READ access, but action requires EDIT privilege`
        );
        return { allowed: false, reason: 'Forbidden: Document requires EDIT privilege' };
      }
      return { allowed: true, isOwner: false, grantedLevel: 'EDIT' };
    }

    // For READ, PREVIEW, DOWNLOAD:
    // Both 'READ' and 'EDIT' grants allow these actions
    return { allowed: true, isOwner: false, grantedLevel: permission.access_level };
  }

  /**
   * Immediately records access refusal events into the immutable audit ledger.
   */
  private static logRefusal(
    params: {
      userId: string;
      userEmail: string;
      userRole: UserRole;
      documentId: string;
      action: RequiredAction;
      ipAddress?: string;
      userAgent?: string;
    },
    reasonCode: string,
    detailMessage: string
  ): void {
    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'ACCESS_REFUSED',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'REFUSED',
      reason: `${reasonCode}: ${detailMessage}`,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        attemptedAction: params.action,
        reasonCode,
      },
    });
  }
}
