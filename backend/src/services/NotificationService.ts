import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SECURITY' | 'GRANT' | 'REVOKE' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export class NotificationService {
  public static createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: 'INFO' | 'SECURITY' | 'GRANT' | 'REVOKE' | 'ALERT';
  }): NotificationItem {
    const db = getDatabase();
    const id = uuidv4();
    const type = params.type || 'INFO';
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, params.userId, params.title, params.message, type, createdAt);

    return {
      id,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type,
      isRead: false,
      createdAt,
    };
  }

  public static getUserNotifications(userId: string): NotificationItem[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT id, user_id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);

    return rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      message: r.message,
      type: r.type,
      isRead: r.is_read === 1,
      createdAt: r.created_at,
    }));
  }

  public static markAsRead(id: string, userId: string): boolean {
    const db = getDatabase();
    const res = db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(id, userId);

    return res.changes > 0;
  }

  public static markAllAsRead(userId: string): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
    `).run(userId);
  }
}

