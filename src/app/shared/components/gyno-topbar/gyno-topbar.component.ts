import { Component, Input, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'gyno-topbar',
  template: `
    <div class="flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant px-4 py-3">
      <h1 class="font-sans text-lg! font-bold! m-0! text-primary-600 tracking-tight">
        {{ title }}
      </h1>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="w-8 h-8 border-0 bg-transparent text-primary-600 rounded-full! inline-flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-primary-50 relative"
          aria-label="Notificaciones"
          (click)="goToNotifications()"
        >
          <i class="not-italic text-xl mgc_notification_line"></i>
          @if (notificationService.unreadCount() > 0) {
            <span
              class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white font-sans text-[10px] font-bold leading-[16px] text-center"
            >
              {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
            </span>
          }
        </button>
        <button
          type="button"
          class="w-8 h-8 border-0 bg-transparent text-primary-600 rounded-full! inline-flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-primary-50"
          aria-label="Perfil"
          routerLink="/home/edit-profile"
        >
          <i class="not-italic text-xl mgc_user_1_line"></i>
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [RouterModule],
  styles: [
    `
      :host {
        display: block;
        padding-top: var(--ion-safe-area-top, 0px);
      }
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class GynoTopbarComponent {
  @Input() title: string = '';
  protected notificationService = inject(NotificationService);
  private router = inject(Router);

  goToNotifications() {
    this.router.navigate(['/home/notifications']);
  }
}
