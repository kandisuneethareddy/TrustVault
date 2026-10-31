import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { AccessLevel, AiAdvisoryRecord, DocumentClassification } from '../types';
import { AuditLogService } from './AuditLogService';
import { PermissionEngine } from './PermissionEngine';

export interface SuggestedGrant {
  userId: string;
  userEmail: string;
  userName: string;
  suggestedLevel: AccessLevel;
  reason: string;
}

export interface AiAnalysisResult {
  advisoryId: string;
  documentId: string;
  suggestedClassification: DocumentClassification;
  confidenceScore: number;
  reasoning: string;
  suggestedGrants: SuggestedGrant[];
  riskIndicators: string[];
}

export class AiPolicyService {
  /**
   * Evaluates document risk and generates advisory recommendations.
   * Note: This does NOT grant permissions. It ONLY produces a suggestion for human review.
   */
  public static async analyzeDocument(params: {
    documentId: string;
    userId: string;
    userEmail: string;
    userRole: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AiAnalysisResult> {
    const db = getDatabase();

    // Verify user owns or can manage document
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      documentId: params.documentId,
      action: 'MANAGE_PERMISSIONS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error('Only the document owner can request AI access analysis');
    }

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.documentId) as any;
    if (!doc) throw new Error('Document not found');

    const users = db.prepare('SELECT id, email, name, role, department FROM users WHERE id != ?').all(params.userId) as any[];

    // Deterministic Enterprise Rule Engine + Semantic Risk Heuristics
    const titleAndDesc = `${doc.title} ${doc.description} ${doc.category}`.toLowerCase();
    const riskIndicators: string[] = [];
    let suggestedClassification: DocumentClassification = 'INTERNAL';
    let confidence = 0.85;

    if (titleAndDesc.includes('salary') || titleAndDesc.includes('payroll') || titleAndDesc.includes('compensation') || titleAndDesc.includes('bonus')) {
      suggestedClassification = 'RESTRICTED';
      riskIndicators.push('Sensitive Compensation & PII detected');
      riskIndicators.push('Strict Zero-Trust compartmentalization required (HR & Executive access only)');
      confidence = 0.98;
    } else if (titleAndDesc.includes('contract') || titleAndDesc.includes('nda') || titleAndDesc.includes('agreement') || titleAndDesc.includes('legal')) {
      suggestedClassification = 'CONFIDENTIAL';
      riskIndicators.push('Binding Legal Liability / Contractual Terms detected');
      riskIndicators.push('External party counter-signatory boundary enforcement required');
      confidence = 0.92;
    } else if (titleAndDesc.includes('audit') || titleAndDesc.includes('compliance') || titleAndDesc.includes('regulator') || titleAndDesc.includes('gdpr')) {
      suggestedClassification = 'RESTRICTED';
      riskIndicators.push('Regulatory Oversight & Mandatory Auditability detected');
      riskIndicators.push('Immutable evidentiary trail required for judicial discovery');
      confidence = 0.96;
    } else if (titleAndDesc.includes('source') || titleAndDesc.includes('code') || titleAndDesc.includes('patent') || titleAndDesc.includes('design') || titleAndDesc.includes('blueprint')) {
      suggestedClassification = 'CONFIDENTIAL';
      riskIndicators.push('Core Proprietary Intellectual Property (IP)');
      confidence = 0.90;
    }

    // Match candidate users by department relevance
    const suggestedGrants: SuggestedGrant[] = [];

    for (const u of users) {
      const uDept = (u.department || '').toLowerCase();
      if (suggestedClassification === 'RESTRICTED') {
        if (uDept.includes('hr') || uDept.includes('executive') || uDept.includes('legal')) {
          suggestedGrants.push({
            userId: u.id,
            userEmail: u.email,
            userName: u.name,
            suggestedLevel: 'READ',
            reason: `Department alignment (${u.department}) with high-sensitivity document`,
          });
        }
      } else if (suggestedClassification === 'CONFIDENTIAL') {
        if (uDept.includes('finance') || uDept.includes('legal') || uDept.includes('engineering') || uDept.includes('operations')) {
          suggestedGrants.push({
            userId: u.id,
            userEmail: u.email,
            userName: u.name,
            suggestedLevel: 'READ',
            reason: `Operational stakeholder (${u.department}) recommended for review`,
          });
        }
      }
    }

    const reasoning = `Based on document context (${doc.title}), TrustVault AI identified ${riskIndicators.length} risk vectors. ` +
      `Recommended policy: ${suggestedClassification}. Identified ${suggestedGrants.length} suggested recipient(s) for human authorization.`;

    const advisoryId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ai_advisories (
        id, document_id, suggested_classification, suggested_grants,
        reasoning, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      advisoryId,
      params.documentId,
      suggestedClassification,
      JSON.stringify(suggestedGrants),
      reasoning,
      now
    );

    // Record that AI suggested, but did not apply
    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'AI_CLASSIFICATION_REQUEST',
      resourceId: params.documentId,
      resourceType: 'AI_ADVISORY',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        advisoryId,
        suggestedClassification,
        suggestedGrantsCount: suggestedGrants.length,
        note: 'AI suggestion generated. Awaiting human confirmation. Zero permissions modified autonomously.',
      },
    });

    return {
      advisoryId,
      documentId: params.documentId,
      suggestedClassification,
      confidenceScore: confidence,
      reasoning,
      suggestedGrants,
      riskIndicators,
    };
  }

  /**
   * Human Confirmation Workflow:
   * The document owner explicitly reviews, modifies, accepts or rejects the AI suggestion.
   * Both the AI suggestion and the human decision are permanently logged to the audit ledger.
   */
  public static async reviewAdvisory(params: {
    advisoryId: string;
    decision: 'CONFIRM' | 'REJECT' | 'MODIFY';
    approvedGrants?: Array<{ userId: string; accessLevel: AccessLevel; validUntil?: string | null }>;
    updatedClassification?: DocumentClassification;
    userId: string;
    userEmail: string;
    userRole: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ status: string; appliedGrantsCount: number }> {
    const db = getDatabase();

    const advisory = db.prepare('SELECT * FROM ai_advisories WHERE id = ?').get(params.advisoryId) as any;
    if (!advisory) throw new Error('AI Advisory record not found');

    // Verify caller is owner
    const auth = await PermissionEngine.evaluateAccess({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      documentId: advisory.document_id,
      action: 'MANAGE_PERMISSIONS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (!auth.allowed) {
      throw new Error('Only the document owner can review and apply AI access advisories');
    }

    let appliedCount = 0;
    const now = new Date().toISOString();

    if (params.decision === 'CONFIRM' || params.decision === 'MODIFY') {
      const grantsToApply = params.approvedGrants || JSON.parse(advisory.suggested_grants || '[]');

      for (const grant of grantsToApply) {
        const grantId = uuidv4();
        db.prepare(`
          INSERT INTO permissions (id, document_id, user_id, access_level, granted_by, valid_from, valid_until, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(document_id, user_id) DO UPDATE SET
            access_level = excluded.access_level,
            granted_by = excluded.granted_by,
            valid_until = excluded.valid_until,
            updated_at = excluded.updated_at
        `).run(
          grantId,
          advisory.document_id,
          grant.userId,
          grant.accessLevel || 'READ',
          params.userId,
          now,
          grant.validUntil || null,
          now,
          now
        );
        appliedCount++;
      }

      if (params.updatedClassification) {
        db.prepare('UPDATE documents SET classification = ?, updated_at = ? WHERE id = ?').run(
          params.updatedClassification,
          now,
          advisory.document_id
        );
      }
    }

    const finalStatus = params.decision === 'REJECT' ? 'REJECTED' : params.decision === 'MODIFY' ? 'MODIFIED' : 'CONFIRMED';

    db.prepare(`
      UPDATE ai_advisories
      SET status = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).run(finalStatus, params.userId, now, params.advisoryId);

    // Record human-in-the-loop decision in audit ledger
    AuditLogService.record({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'AI_CLASSIFICATION_REVIEWED',
      resourceId: advisory.document_id,
      resourceType: 'DOCUMENT',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        advisoryId: params.advisoryId,
        humanDecision: finalStatus,
        reviewedBy: params.userEmail,
        appliedGrantsCount: appliedCount,
        originalAiClassification: advisory.suggested_classification,
        finalClassification: params.updatedClassification || advisory.suggested_classification,
      },
    });

    return { status: finalStatus, appliedGrantsCount: appliedCount };
  }
}
