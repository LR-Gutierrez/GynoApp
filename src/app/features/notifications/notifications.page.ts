import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { NotificationService } from 'src/app/core/services/notification.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import type { AppNotification } from 'src/app/shared/models/notification.model';

interface NotificationGroup {
  date: string;
  items: AppNotification[];
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    GynoPageHeaderComponent,
    GynoBottomNavComponent,
  ],
  styles: [
    `
      :host {
        display: block;
      }
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
      .skeleton-shimmer {
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255,255,255,0.06) 50%,
          transparent 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }
      @keyframes shimmer {
        from { background-position: 200% 0; }
        to { background-position: -200% 0; }
      }
    `,
  ],
})
export class NotificationsPage {
  private router = inject(Router);
  private settings = inject(SettingsService);
  protected notificationService = inject(NotificationService);

  private timeFormat: '12h' | '24h' = '24h';
  readonly loading = signal(true);

  readonly groupedNotifications = computed(() => {
    const groups: NotificationGroup[] = [];
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const map = new Map<string, AppNotification[]>();
    for (const n of this.notificationService.notifications()) {
      const d = new Date(n.createdAt);
      let label: string;
      if (d.toDateString() === todayStr) {
        label = 'Hoy';
      } else if (d.toDateString() === yesterdayStr) {
        label = 'Ayer';
      } else {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        label = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }

    for (const [date, items] of map) {
      groups.push({ date, items });
    }
    return groups;
  });

  async ionViewWillEnter() {
    this.timeFormat = await this.settings.getTimeFormat();
    this.loading.set(false);
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return this.settings.formatTime(`${hh}:${mm}`, this.timeFormat);
  }

  notificationIcon(type: string): string {
    switch (type) {
      case 'cita_creada': return 'mgc_calendar_add_line';
      case 'cita_cancelada': return 'mgc_calendar_x_line';
      case 'cita_atendida': return 'mgc_check_line';
      case 'recordatorio_cita': return 'mgc_alarm_line';
      default: return 'mgc_notification_line';
    }
  }

  onNotificationClick(n: AppNotification) {
    if (!n.read) {
      this.notificationService.markAsRead(n.id);
    }
    if (n.data['appointmentId']) {
      this.router.navigate(['/home/schedule']);
    } else if (n.data['patientId']) {
      this.router.navigate(['/home/patient', n.data['patientId']]);
    }
  }

  onMarkAllRead() {
    this.notificationService.markAllAsRead();
  }

  onDismiss(event: Event, id: string) {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
