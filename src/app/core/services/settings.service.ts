import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type TimeFormat = '12h' | '24h';
export type AutoLockMinutes = 1 | 2 | 5 | 10 | 15 | 30 | 0;
export type ReminderTiming = 15 | 30 | 60 | 120 | 1440;

const TIME_FORMAT_KEY = 'gyno_time_format';
const AUTO_LOCK_KEY = 'gyno_auto_lock';
const NOTIFICATIONS_ENABLED_KEY = 'gyno_notifications_enabled';
const REMINDER_TIMING_KEY = 'gyno_reminder_timing';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private cachedTimeFormat: TimeFormat | null = null;
  private cachedAutoLock: AutoLockMinutes | null = null;

  readonly notificationsEnabled = signal(false);
  readonly reminderTiming = signal<ReminderTiming>(120);

  async getTimeFormat(): Promise<TimeFormat> {
    if (this.cachedTimeFormat) return this.cachedTimeFormat;
    const { value } = await Preferences.get({ key: TIME_FORMAT_KEY });
    this.cachedTimeFormat = (value as TimeFormat) || '24h';
    return this.cachedTimeFormat;
  }

  async setTimeFormat(format: TimeFormat): Promise<void> {
    await Preferences.set({ key: TIME_FORMAT_KEY, value: format });
    this.cachedTimeFormat = format;
  }

  async getAutoLock(): Promise<AutoLockMinutes> {
    if (this.cachedAutoLock !== null) return this.cachedAutoLock;
    const { value } = await Preferences.get({ key: AUTO_LOCK_KEY });
    const parsed = value ? parseInt(value, 10) as AutoLockMinutes : 5;
    this.cachedAutoLock = parsed;
    return this.cachedAutoLock;
  }

  async setAutoLock(minutes: AutoLockMinutes): Promise<void> {
    await Preferences.set({ key: AUTO_LOCK_KEY, value: String(minutes) });
    this.cachedAutoLock = minutes;
  }

  async initNotificationPrefs() {
    const [enabled, timing] = await Promise.all([
      this.getNotificationsEnabled(),
      this.getReminderTiming(),
    ]);
    this.notificationsEnabled.set(enabled);
    this.reminderTiming.set(timing);
  }

  async getNotificationsEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: NOTIFICATIONS_ENABLED_KEY });
    return value === 'true';
  }

  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await Preferences.set({ key: NOTIFICATIONS_ENABLED_KEY, value: String(enabled) });
    this.notificationsEnabled.set(enabled);
  }

  async getReminderTiming(): Promise<ReminderTiming> {
    const { value } = await Preferences.get({ key: REMINDER_TIMING_KEY });
    return (value ? parseInt(value, 10) : 120) as ReminderTiming;
  }

  async setReminderTiming(minutes: ReminderTiming): Promise<void> {
    await Preferences.set({ key: REMINDER_TIMING_KEY, value: String(minutes) });
    this.reminderTiming.set(minutes);
  }

  readonly reminderTimingOptions: { value: ReminderTiming; label: string }[] = [
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
    { value: 120, label: '2 horas antes' },
    { value: 1440, label: '24 horas antes' },
  ];

  formatTime(time: string | undefined, targetFormat?: TimeFormat): string {
    if (!time) return '—';
    if (targetFormat && targetFormat === '24h') return time;

    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return time;

    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }

  hourValues(format: TimeFormat): string[] {
    if (format === '24h') {
      return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    }
    return Array.from({ length: 12 }, (_, i) => String(i + 1));
  }

  hour24to12(hour24: string): { hour: string; period: 'AM' | 'PM' } {
    const h = parseInt(hour24, 10);
    if (isNaN(h)) return { hour: '12', period: 'AM' };
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return { hour: String(hour), period };
  }

  hour12to24(hour: string, period: 'AM' | 'PM'): string {
    let h = parseInt(hour, 10);
    if (isNaN(h)) return '00';
    if (period === 'AM') return h === 12 ? '00' : String(h).padStart(2, '0');
    return h === 12 ? '12' : String(h + 12).padStart(2, '0');
  }
}
