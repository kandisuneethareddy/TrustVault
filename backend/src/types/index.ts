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
  | 'PERMISSION_BATCH_UPDATE'
  | 'ACCESS_REFUSED'
  | 'AI_CLASSIFICATION_REQUEST'
  | 'AI_CLASSIFICATION_REVIEWED'
  | 'AUDIT_VERIFY_INTEGRITY'
  | 'SYSTEM_TAMPER_SIMULATION';

export type AuditStatus = 'SUCCESS' | 'REFUSED';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  department: string;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  checksumSha256: string;
  encryptionIv: string;
  encryptionTag: string;
  ownerId: string;
  classification: DocumentClassification;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRecord {
  id: string;
  documentId: string;
  userId: string;
  accessLevel: AccessLevel;
  grantedBy: string;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: AuditAction;
  resourceId: string | null;
  resourceType: string | null;
  status: AuditStatus;
  reason: string | null;
  ipAddress: string;
  userAgent: string;
  metadata: string; // JSON stringified
  previousHash: string;
  hash: string;
}

export interface AiAdvisoryRecord {
  id: string;
  documentId: string;
  suggestedClassification: DocumentClassification;
  suggestedGrants: string; // JSON string of suggested user grants
  reasoning: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'MODIFIED';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
}
