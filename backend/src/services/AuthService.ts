import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';
import { getDatabase } from '../db/database';
import { SanitizedUser, User, UserRole } from '../types';
import { AuditLogService } from './AuditLogService';

export class AuthService {
  /**
   * Hashes a password using bcrypt with salt rounds 10.
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compares plain password with bcrypt hash.
   */
  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Signs a JWT with user identity and tokenVersion for immediate revocation support.
   */
  public static signToken(user: { id: string; email: string; role: UserRole; tokenVersion: number }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      CONFIG.JWT_SECRET,
      { expiresIn: '8h' }
    );
  }

  /**
   * Registers a new user.
   */
  public static async register(params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    department: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ user: SanitizedUser; token: string }> {
    const db = getDatabase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(params.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const id = uuidv4();
    const passwordHash = await this.hashPassword(params.password);
    const tokenVersion = 1;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, department, token_version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, params.email, passwordHash, params.name, params.role, params.department, tokenVersion, now, now);

    const user: SanitizedUser = {
      id,
      email: params.email,
      name: params.name,
      role: params.role,
      department: params.department,
      createdAt: now,
    };

    const token = this.signToken({ id, email: params.email, role: params.role, tokenVersion });

    AuditLogService.record({
      userId: id,
      userEmail: params.email,
      userRole: params.role,
      action: 'AUTH_REGISTER',
      resourceId: id,
      resourceType: 'USER',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { department: params.department },
    });

    return { user, token };
  }

  /**
   * Authenticates user and issues JWT.
   */
  public static async login(params: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ user: SanitizedUser; token: string }> {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(params.email) as User | undefined;

    if (!user) {
      AuditLogService.record({
        userEmail: params.email,
        action: 'ACCESS_REFUSED',
        status: 'REFUSED',
        reason: 'AUTH_FAILED: User email not registered',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: { attemptedEmail: params.email },
      });
      throw new Error('Invalid email or password');
    }

    const matches = await this.comparePassword(params.password, user.passwordHash || (user as any).password_hash);
    if (!matches) {
      AuditLogService.record({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'ACCESS_REFUSED',
        status: 'REFUSED',
        reason: 'AUTH_FAILED: Incorrect password',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
      throw new Error('Invalid email or password');
    }

    const sanitized: SanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt || (user as any).created_at,
    };

    const tokenVersion = user.tokenVersion || (user as any).token_version || 1;
    const token = this.signToken({ id: user.id, email: user.email, role: user.role, tokenVersion });

    AuditLogService.record({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'AUTH_LOGIN',
      resourceId: user.id,
      resourceType: 'USER',
      status: 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return { user: sanitized, token };
  }

  /**
   * Invalidate all existing tokens for a user immediately by incrementing token_version.
   */
  public static revokeAllSessions(userId: string): void {
    const db = getDatabase();
    db.prepare('UPDATE users SET token_version = token_version + 1, updated_at = datetime("now") WHERE id = ?').run(userId);
  }

  /**
   * Fetches user by ID.
   */
  public static getUserById(userId: string): SanitizedUser | null {
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, name, role, department, created_at FROM users WHERE id = ?').get(userId) as any;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      createdAt: user.created_at,
    };
  }

  /**
   * Lists all users (for permission granting UI).
   */
  public static listUsers(): SanitizedUser[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT id, email, name, role, department, created_at FROM users ORDER BY name ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      department: r.department,
      createdAt: r.created_at,
    }));
  }
}
