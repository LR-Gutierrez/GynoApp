import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocalNotifications } from '@capacitor/local-notifications';
import { DatabaseService } from './database.service';
import { SettingsService } from './settings.service';
import type { AppNotification, NotificationType } from 'src/app/shared/models/notification.model';

const NOTIFICATION_CHANNEL_ID = 'gyno-appointments';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private database = inject(DatabaseService);
  private settings = inject(SettingsService);
  private router = inject(Router);

  readonly unreadCount = signal(0);
  readonly notifications = signal<AppNotification[]>([]);

  async init() {
    await this.settings.initNotificationPrefs();
    await this.registerChannels();
    await this.loadNotifications();
    this.rescheduleMissedReminders();
    this.listenForNotificationTap();
  }

  private async registerChannels() {
    try {
      const channels = await LocalNotifications.listChannels();
      const hasChannel = channels.channels?.some(c => c.id === NOTIFICATION_CHANNEL_ID);
      if (!hasChannel) {
        await LocalNotifications.createChannel({
          id: NOTIFICATION_CHANNEL_ID,
          name: 'Recordatorios de citas',
          description: 'Notificaciones de citas programadas',
          importance: 4,
          visibility: 1,
        });
      }
    } catch {
    }
  }

  private async loadNotifications() {
    try {
      const db = await this.database.getDb();
      const result = await db.query(
        'SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 50',
        [],
      );
      const list: AppNotification[] = (result.values ?? []).map(this.mapRow);
      this.notifications.set(list);
      this.unreadCount.set(list.filter(n => !n.read).length);
    } catch {
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') return true;
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } catch {
      return false;
    }
  }

  async scheduleAppointmentReminder(
    appointmentId: string,
    patientName: string,
    reason: string,
    date: string,
    time: string,
  ) {
    if (!this.settings.notificationsEnabled()) return;

    const reminderMinutes = this.settings.reminderTiming();
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const appointmentDate = new Date(y, m - 1, d, hh, mm);
    const reminderDate = new Date(appointmentDate.getTime() - reminderMinutes * 60 * 1000);

    if (reminderDate <= new Date()) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Recordatorio de cita',
            body: `${patientName} — ${reason}`,
            id: this.hashId(appointmentId),
            schedule: { at: reminderDate },
            channelId: NOTIFICATION_CHANNEL_ID,
            extra: { appointmentId, patientName },
          },
        ],
      });
    } catch {
    }
  }

  async cancelAppointmentReminder(appointmentId: string) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: this.hashId(appointmentId) }] });
    } catch {
    }
  }

  async addNotification(type: NotificationType, title: string, message: string, data?: Record<string, string>) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const dataStr = JSON.stringify(data ?? {});

    try {
      const db = await this.database.getDb();
      await db.run(
        `INSERT INTO notifications (id, type, title, message, data, read, createdAt)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [id, type, title, message, dataStr, createdAt],
      );
    } catch {
    }

    const notification: AppNotification = {
      id, type, title, message, data: data ?? {}, read: false, createdAt,
    };
    this.notifications.update(list => [notification, ...list]);
    this.unreadCount.update(c => c + 1);
  }

  async markAsRead(id: string) {
    try {
      const db = await this.database.getDb();
      await db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
    } catch {
    }
    this.notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
    this.unreadCount.update(c => Math.max(0, c - 1));
  }

  async markAllAsRead() {
    try {
      const db = await this.database.getDb();
      await db.run('UPDATE notifications SET read = 1 WHERE read = 0', []);
    } catch {
    }
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.unreadCount.set(0);
  }

  async deleteNotification(id: string) {
    try {
      const db = await this.database.getDb();
      await db.run('DELETE FROM notifications WHERE id = ?', [id]);
    } catch {
    }
    this.notifications.update(list => {
      const removed = list.find(n => n.id === id);
      if (removed && !removed.read) this.unreadCount.update(c => Math.max(0, c - 1));
      return list.filter(n => n.id !== id);
    });
  }

  async clearAll() {
    try {
      const db = await this.database.getDb();
      await db.run('DELETE FROM notifications', []);
    } catch {
    }
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  private async rescheduleMissedReminders() {
    try {
      const db = await this.database.getDb();
      const result = await db.query(
        `SELECT c.*, p.name as patientName FROM consultations c
         JOIN patients p ON p.id = c.patientId
         WHERE c.status = 'programada' AND c.date >= ?`,
        [new Date().toISOString().split('T')[0]],
      );
      for (const row of result.values ?? []) {
        await this.scheduleAppointmentReminder(
          row.id, row.patientName, row.motivo, row.date, row.time,
        );
      }
    } catch {
    }
  }

  private listenForNotificationTap() {
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const appointmentId = notification.notification.extra?.['appointmentId'] as string;
      if (appointmentId) {
        this.router.navigate(['/home/schedule']);
      }
    });
  }

  private hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private mapRow(row: any): AppNotification {
    return {
      id: row.id,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      data: JSON.parse(row.data ?? '{}'),
      read: row.read === 1,
      createdAt: row.createdAt,
    };
  }
}
