import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { CONFIG } from '../config';
import { AuditAction, AuditLogRecord, AuditStatus } from '../types';

export interface RecordAuditParams {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: AuditAction;
  resourceId?: string | null;
  resourceType?: string | null;
  status: AuditStatus;
  reason?: string | null;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  isValid: boolean;
  totalRecords: number;
  genesisHash: string;
  latestHash: string | null;
  corruptedBlock?: {
    sequenceNumber: number;
    id: string;
    expectedHash: string;
    actualHash: string;
    reason: string;
  };
}

export class AuditLogService {
  /**
   * Deterministically calculates SHA-256 hash of an audit record.
   */
  public static calculateHash(payload: {
    sequenceNumber: number;
    id: string;
    timestamp: string;
    userId: string | null;
    userEmail: string | null;
    userRole: string | null;
    action: string;
    resourceId: string | null;
    resourceType: string | null;
    status: string;
    reason: string | null;
    ipAddress: string;
    userAgent: string;
    metadata: string;
    previousHash: string;
  }): string {
    const canonicalString = [
      payload.sequenceNumber,
      payload.id,
      payload.timestamp,
      payload.userId || '',
      payload.userEmail || '',
      payload.userRole || '',
      payload.action,
      payload.resourceId || '',
      payload.resourceType || '',
      payload.status,
      payload.reason || '',
      payload.ipAddress,
      payload.userAgent,
      payload.metadata,
      payload.previousHash,
    ].join('|');

    return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  }

  /**
   * Records an immutable, cryptographically chained audit log entry.
   * Atomic transaction guarantees chain consistency under concurrent requests.
   */
  public static record(params: RecordAuditParams): AuditLogRecord {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const metadataStr = JSON.stringify(params.metadata || {});
    const ip = params.ipAddress || '127.0.0.1';
    const agent = params.userAgent || 'TrustVault Core Service';

    // Wrap in SQLite immediate transaction to prevent concurrency race in hash chaining
    const insertTransaction = db.transaction(() => {
      // Fetch latest block in chain
      const lastBlock = db
        .prepare('SELECT sequence_number, hash FROM audit_logs ORDER BY sequence_number DESC LIMIT 1')
        .get() as { sequence_number: number; hash: string } | undefined;

      const nextSequence = lastBlock ? lastBlock.sequence_number + 1 : 1;
      const previousHash = lastBlock ? lastBlock.hash : CONFIG.AUDIT_GENESIS_PREV_HASH;

      const hash = this.calculateHash({
        sequenceNumber: nextSequence,
        id,
        timestamp: now,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        action: params.action,
        resourceId: params.resourceId || null,
        resourceType: params.resourceType || null,
        status: params.status,
        reason: params.reason || null,
        ipAddress: ip,
        userAgent: agent,
        metadata: metadataStr,
        previousHash,
      });

      db.prepare(`
        INSERT INTO audit_logs (
          sequence_number, id, timestamp, user_id, user_email, user_role,
          action, resource_id, resource_type, status, reason,
          ip_address, user_agent, metadata, previous_hash, hash
        ) VALUES (
          @sequenceNumber, @id, @timestamp, @userId, @userEmail, @userRole,
          @action, @resourceId, @resourceType, @status, @reason,
          @ipAddress, @userAgent, @metadata, @previousHash, @hash
        )
      `).run({
        sequenceNumber: nextSequence,
        id,
        timestamp: now,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        action: params.action,
        resourceId: params.resourceId || null,
        resourceType: params.resourceType || null,
        status: params.status,
        reason: params.reason || null,
        ipAddress: ip,
        userAgent: agent,
        metadata: metadataStr,
        previousHash,
        hash,
      });

      return {
        id,
        sequenceNumber: nextSequence,
        timestamp: now,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        action: params.action,
        resourceId: params.resourceId || null,
        resourceType: params.resourceType || null,
        status: params.status,
        reason: params.reason || null,
        ipAddress: ip,
        userAgent: agent,
        metadata: metadataStr,
        previousHash,
        hash,
      } as AuditLogRecord;
    });

    return insertTransaction();
  }

  /**
   * Cryptographically verifies the entire audit ledger from Genesis block to tip.
   */
  public static verifyLedgerIntegrity(): VerificationResult {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM audit_logs ORDER BY sequence_number ASC').all() as any[];

    if (rows.length === 0) {
      return {
        isValid: true,
        totalRecords: 0,
        genesisHash: CONFIG.AUDIT_GENESIS_PREV_HASH,
        latestHash: null,
      };
    }

    let expectedPrevHash = CONFIG.AUDIT_GENESIS_PREV_HASH;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // 1. Check chain linkage: previous_hash must match previous block's hash
      if (row.previous_hash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecords: rows.length,
          genesisHash: CONFIG.AUDIT_GENESIS_PREV_HASH,
          latestHash: rows[rows.length - 1].hash,
          corruptedBlock: {
            sequenceNumber: row.sequence_number,
            id: row.id,
            expectedHash: expectedPrevHash,
            actualHash: row.previous_hash,
            reason: `Broken chain link at sequence #${row.sequence_number}: previous_hash does not match preceding block's hash`,
          },
        };
      }

      // 2. Re-compute SHA-256 hash over canonical fields
      const recalculatedHash = this.calculateHash({
        sequenceNumber: row.sequence_number,
        id: row.id,
        timestamp: row.timestamp,
        userId: row.user_id,
        userEmail: row.user_email,
        userRole: row.user_role,
        action: row.action,
        resourceId: row.resource_id,
        resourceType: row.resource_type,
        status: row.status,
        reason: row.reason,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        metadata: row.metadata,
        previousHash: row.previous_hash,
      });

      if (recalculatedHash !== row.hash) {
        return {
          isValid: false,
          totalRecords: rows.length,
          genesisHash: CONFIG.AUDIT_GENESIS_PREV_HASH,
          latestHash: rows[rows.length - 1].hash,
          corruptedBlock: {
            sequenceNumber: row.sequence_number,
            id: row.id,
            expectedHash: recalculatedHash,
            actualHash: row.hash,
            reason: `Content tampering detected at sequence #${row.sequence_number}: stored hash does not match recalculation of canonical data`,
          },
        };
      }

      expectedPrevHash = row.hash;
    }

    return {
      isValid: true,
      totalRecords: rows.length,
      genesisHash: CONFIG.AUDIT_GENESIS_PREV_HASH,
      latestHash: rows[rows.length - 1].hash,
    };
  }

  /**
   * Tamper simulation utility for security testing and live judge demonstrations.
   * Maliciously alters a row in the database without updating the cryptographically chained hash.
   */
  public static simulateTamper(sequenceNumber: number, maliciousAction: string): void {
    const db = getDatabase();
    db.prepare('UPDATE audit_logs SET action = ? WHERE sequence_number = ?').run(maliciousAction, sequenceNumber);
  }

  /**
   * Queries audit logs with filtering and pagination.
   */
  public static queryLogs(filters: {
    userId?: string;
    action?: string;
    resourceId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): { logs: AuditLogRecord[]; total: number } {
    const db = getDatabase();
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
    const params: any = {};

    if (filters.userId) {
      query += ' AND user_id = @userId';
      countQuery += ' AND user_id = @userId';
      params.userId = filters.userId;
    }

    if (filters.action) {
      query += ' AND action = @action';
      countQuery += ' AND action = @action';
      params.action = filters.action;
    }

    if (filters.resourceId) {
      query += ' AND resource_id = @resourceId';
      countQuery += ' AND resource_id = @resourceId';
      params.resourceId = filters.resourceId;
    }

    if (filters.status) {
      query += ' AND status = @status';
      countQuery += ' AND status = @status';
      params.status = filters.status;
    }

    if (filters.search) {
      query += ' AND (user_email LIKE @search OR action LIKE @search OR reason LIKE @search OR resource_id LIKE @search)';
      countQuery += ' AND (user_email LIKE @search OR action LIKE @search OR reason LIKE @search OR resource_id LIKE @search)';
      params.search = `%${filters.search}%`;
    }

    query += ' ORDER BY sequence_number DESC LIMIT @limit OFFSET @offset';
    params.limit = filters.limit || 50;
    params.offset = filters.offset || 0;

    const countResult = db.prepare(countQuery).get(params) as { count: number };
    const logs = db.prepare(query).all(params) as any[];

    const formattedLogs: AuditLogRecord[] = logs.map(row => ({
      id: row.id,
      sequenceNumber: row.sequence_number,
      timestamp: row.timestamp,
      userId: row.user_id,
      userEmail: row.user_email,
      userRole: row.user_role,
      action: row.action as AuditAction,
      resourceId: row.resource_id,
      resourceType: row.resource_type,
      status: row.status as AuditStatus,
      reason: row.reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata,
      previousHash: row.previous_hash,
      hash: row.hash,
    }));

    return {
      logs: formattedLogs,
      total: countResult.count,
    };
  }
}

