import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { AccessLevel, PermissionRecord, UserRole } from '../types';
import { AuditLogService } from './AuditLogService';
import { PermissionEngine } from './PermissionEngine';

export class PermissionService {
  /**
   * Grants or updates access for a named user.
   */
  public static async grantPermission(params: {
    documentId: string;
    targetUserId: string;
    accessLevel: AccessLevel;
    validUntil?: string | null;
    grantedByUserId: string;
    grantedByUserEmail: string;
    grantedByUserRole: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<PermissionRecord> {
    const db = getDatabase();

    // 1. Authorize: Only document owner can grant permissions
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.grantedByUserId,
      userEmail: params.grantedByUserEmail,
      userRole: params.grantedByUserRole,
      documentId: params.documentId,
      action: 'MANAGE_PERMISSIONS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error(auth.reason || 'Only the document owner can grant permissions');
    }

    // 2. Validate target user exists
    const targetUser = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(params.targetUserId) as any;
    if (!targetUser) {
      throw new Error('Target user does not exist');
    }

    // Cannot grant permission to oneself (owner already has full rights)
    if (params.targetUserId === params.grantedByUserId) {
      throw new Error('Cannot grant permission to yourself; you are already the document owner');
    }

    const grantId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO permissions (
        id, document_id, user_id, access_level, granted_by,
        valid_from, valid_until, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(document_id, user_id) DO UPDATE SET
        access_level = excluded.access_level,
        granted_by = excluded.granted_by,
        valid_until = excluded.valid_until,
        updated_at = excluded.updated_at
    `).run(
      grantId,
      params.documentId,
      params.targetUserId,
      params.accessLevel,
      params.grantedByUserId,
      now,
      params.validUntil || null,
      now,
      now
    );

    const permission = db.prepare('SELECT * FROM permissions WHERE document_id = ? AND user_id = ?').get(
      params.documentId,
      params.targetUserId
    ) as any;

    // 3. Log to immutable audit ledger
    AuditLogService.record({
      userId: params.grantedByUserId,
      userEmail: params.grantedByUserEmail,
      userRole: params.grantedByUserRole,
      action: 'PERMISSION_GRANT',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        targetUserId: params.targetUserId,
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
        accessLevel: params.accessLevel,
        validUntil: params.validUntil || null,
      },
    });

    return {
      id: permission.id,
      documentId: permission.document_id,
      userId: permission.user_id,
      accessLevel: permission.access_level,
      grantedBy: permission.granted_by,
      validFrom: permission.valid_from,
      validUntil: permission.valid_until,
      createdAt: permission.created_at,
      updatedAt: permission.updated_at,
    };
  }

  /**
   * Instantly revokes a user's permission grant.
   * Access is severed in real-time immediately upon execution.
   */
  public static async revokePermission(params: {
    documentId: string;
    targetUserId: string;
    revokedByUserId: string;
    revokedByUserEmail: string;
    revokedByUserRole: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const db = getDatabase();

    // 1. Authorize: Only document owner (or admin override) can revoke
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.revokedByUserId,
      userEmail: params.revokedByUserEmail,
      userRole: params.revokedByUserRole,
      documentId: params.documentId,
      action: 'MANAGE_PERMISSIONS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed && params.revokedByUserRole !== 'admin') {
      throw new Error(auth.reason || 'Only the document owner or compliance administrator can revoke permissions');
    }

    const targetUser = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(params.targetUserId) as any;
    const existing = db.prepare('SELECT id, access_level FROM permissions WHERE document_id = ? AND user_id = ?').get(
      params.documentId,
      params.targetUserId
    ) as any;

    if (!existing) {
      throw new Error('No active permission grant found for this user');
    }

    // 2. Immediate deletion from database (enforces instantaneous revocation)
    db.prepare('DELETE FROM permissions WHERE document_id = ? AND user_id = ?').run(
      params.documentId,
      params.targetUserId
    );

    // 3. Record revocation in audit ledger
    AuditLogService.record({
      userId: params.revokedByUserId,
      userEmail: params.revokedByUserEmail,
      userRole: params.revokedByUserRole,
      action: 'PERMISSION_REVOKE',
      resourceId: params.documentId,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        revokedUserId: params.targetUserId,
        revokedUserEmail: targetUser ? targetUser.email : 'Unknown',
        previousAccessLevel: existing.access_level,
        instantRevocationTimestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Lists all permissions granted for a given document.
   */
  public static async listPermissions(params: {
    documentId: string;
    requestUserId: string;
    requestUserEmail: string;
    requestUserRole: UserRole;
  }): Promise<any[]> {
    const db = getDatabase();

    // Verify caller has READ access or is owner
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.requestUserId,
      userEmail: params.requestUserEmail,
      userRole: params.requestUserRole,
      documentId: params.documentId,
      action: 'READ',
    });

    if (!auth.allowed) {
      throw new Error('Access denied: Cannot view document permissions');
    }

    const rows = db.prepare(`
      SELECT p.*, u.name as user_name, u.email as user_email, u.department as user_department,
             gb.name as granted_by_name
      FROM permissions p
      JOIN users u ON p.user_id = u.id
      JOIN users gb ON p.granted_by = gb.id
      WHERE p.document_id = ?
      ORDER BY p.created_at DESC
    `).all(params.documentId) as any[];

    return rows.map(r => ({
      id: r.id,
      documentId: r.document_id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      userDepartment: r.user_department,
      accessLevel: r.access_level,
      grantedBy: r.granted_by,
      grantedByName: r.granted_by_name,
      validFrom: r.valid_from,
      validUntil: r.valid_until,
      createdAt: r.created_at,
    }));
  }
}
