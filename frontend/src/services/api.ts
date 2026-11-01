import {
  AdminStats,
  AiAdvisory,
  AuditLog,
  DocumentItem,
  PermissionGrant,
  User,
  VerificationResult,
} from '../types';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('trustvault_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('trustvault_token', token);
    } else {
      localStorage.removeItem('trustvault_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // If token expired or session revoked, clean state
      const body = await response.json().catch(() => ({}));
      if (body.code === 'SESSION_REVOKED' || body.code === 'TOKEN_EXPIRED') {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('trustvault_auth_revoked', { detail: body.error }));
      }
      throw new Error(body.error || 'Authentication required');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // --- Auth APIs ---
  public async login(email: string, password: string):Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async demoSwitch(email: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  public async revokeAllSessions(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/revoke-sessions', { method: 'POST' });
  }

  public async listUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/auth/users');
  }

  // --- Documents APIs ---
  public async listDocuments(params: {
    search?: string;
    category?: string;
    ownerId?: string;
    classification?: string;
  } = {}): Promise<{ documents: DocumentItem[] }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.ownerId) query.append('ownerId', params.ownerId);
    if (params.classification) query.append('classification', params.classification);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ documents: DocumentItem[] }>(`/documents${qs}`);
  }

  public async uploadDocument(formData: FormData): Promise<{ document: DocumentItem }> {
    return this.request<{ document: DocumentItem }>('/documents', {
      method: 'POST',
      body: formData,
    });
  }

  public async getDocument(id: string): Promise<{ document: DocumentItem }> {
    return this.request<{ document: DocumentItem }>(`/documents/${id}`);
  }

  public async downloadDocument(id: string): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}/documents/${id}/download`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(err.error || `Download failed with status ${res.status}`);
    }
    return res.blob();
  }

  public async previewDocument(id: string): Promise<{ text?: string; blob?: Blob; mimeType: string }> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}/documents/${id}/preview`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Preview failed' }));
      throw new Error(err.error || `Preview failed with status ${res.status}`);
    }

    const mimeType = res.headers.get('Content-Type') || 'text/plain';
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('csv')) {
      const text = await res.text();
      return { text, mimeType };
    } else {
      const blob = await res.blob();
      return { blob, mimeType };
    }
  }

  public async updateDocument(id: string, updates: {
    title?: string;
    description?: string;
    category?: string;
    classification?: string;
  }): Promise<{ document: DocumentItem }> {
    return this.request<{ document: DocumentItem }>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async deleteDocument(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Permissions APIs ---
  public async listPermissions(documentId: string): Promise<{ permissions: PermissionGrant[] }> {
    return this.request<{ permissions: PermissionGrant[] }>(`/documents/${documentId}/permissions`);
  }

  public async grantPermission(params: {
    documentId: string;
    targetUserId: string;
    accessLevel: 'READ' | 'EDIT';
    validUntil?: string | null;
  }): Promise<{ permission: PermissionGrant }> {
    return this.request<{ permission: PermissionGrant }>(`/documents/${params.documentId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({
        targetUserId: params.targetUserId,
        accessLevel: params.accessLevel,
        validUntil: params.validUntil,
      }),
    });
  }

  public async revokePermission(documentId: string, targetUserId: string): Promise<{ message: string; instantRevocation: boolean }> {
    return this.request<{ message: string; instantRevocation: boolean }>(`/documents/${documentId}/permissions/${targetUserId}`, {
      method: 'DELETE',
    });
  }

  // --- Audit Ledger APIs ---
  public async queryAuditLogs(params: {
    userId?: string;
    action?: string;
    resourceId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.action) query.append('action', params.action);
    if (params.resourceId) query.append('resourceId', params.resourceId);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ logs: AuditLog[]; total: number }>(`/audit${qs}`);
  }

  public async verifyLedger(): Promise<{ verification: VerificationResult }> {
    return this.request<{ verification: VerificationResult }>('/audit/verify');
  }

  public async simulateTamper(sequenceNumber: number, maliciousAction?: string): Promise<any> {
    return this.request('/audit/simulate-tamper', {
      method: 'POST',
      body: JSON.stringify({ sequenceNumber, maliciousAction }),
    });
  }

  public async exportAudit(format: 'json' | 'csv'): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${API_BASE}/audit/export?format=${format}`, { headers });
    return res.blob();
  }

  // --- AI Advisory APIs ---
  public async analyzeDocumentPolicy(documentId: string): Promise<AiAdvisory> {
    return this.request<AiAdvisory>(`/ai/analyze/${documentId}`, { method: 'POST' });
  }

  public async reviewAiAdvisory(payload: {
    advisoryId: string;
    decision: 'CONFIRM' | 'REJECT' | 'MODIFY';
    approvedGrants?: Array<{ userId: string; accessLevel: 'READ' | 'EDIT' }>;
    updatedClassification?: string;
  }): Promise<{ status: string; appliedGrantsCount: number }> {
    return this.request<{ status: string; appliedGrantsCount: number }>('/ai/review', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Admin Telemetry APIs ---
  public async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/admin/stats');
  }

  public async getRefusedAttempts(): Promise<{ refusedAttempts: any[] }> {
    return this.request<{ refusedAttempts: any[] }>('/admin/refused-attempts');
  }
}

export const api = new ApiService();
