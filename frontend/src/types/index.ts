export type UserRole = 'admin' | 'owner' | 'viewer';

export type AccessLevel = 'READ' | 'EDIT';

export type DocumentClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_REGISTER'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_READ'
  | 'DOCUMENT_PREVIEW'
  | 'DOCUMENT_DOWNLOAD'
  | 'DOCUMENT_UPDATE'
  | 'DOCUMENT_DELETE'
  | 'PERMISSION_GRANT'
  | 'PERMISSION_REVOKE'
  | 'ACCESS_REFUSED'
  | 'AI_CLASSIFICATION_REQUEST'
  | 'AI_CLASSIFICATION_REVIEWED'
  | 'AUDIT_VERIFY_INTEGRITY'
  | 'SYSTEM_TAMPER_SIMULATION';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  classification: DocumentClassification;
  accessLevel: 'OWNER' | 'READ' | 'EDIT' | 'ADMIN_AUDIT';
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGrant {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  accessLevel: AccessLevel;
  grantedBy: string;
  grantedByName: string;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: AuditAction;
  resourceId: string | null;
  resourceType: string | null;
  status: 'SUCCESS' | 'REFUSED';
  reason: string | null;
  ipAddress: string;
  userAgent: string;
  metadata: string;
  previousHash: string;
  hash: string;
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

export interface AdminStats {
  metrics: {
    totalDocuments: number;
    totalUsers: number;
    activePermissionGrants: number;
    refusedBreachAttempts: number;
    totalAuditLedgerBlocks: number;
    ledgerIntegrityVerified: boolean;
    latestBlockHash: string;
  };
  classifications: Array<{ classification: string; count: number }>;
  categories: Array<{ category: string; count: number }>;
}

export interface AiSuggestedGrant {
  userId: string;
  userEmail: string;
  userName: string;
  suggestedLevel: AccessLevel;
  reason: string;
}

export interface AiAdvisory {
  advisoryId: string;
  documentId: string;
  suggestedClassification: DocumentClassification;
  confidenceScore: number;
  reasoning: string;
  suggestedGrants: AiSuggestedGrant[];
  riskIndicators: string[];
}
