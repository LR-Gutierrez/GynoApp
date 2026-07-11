import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

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
            class="w-8 h-8 border-0 bg-transparent text-primary-600 rounded-full! inline-flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-primary-50"
          aria-label="Notificaciones"
        >
          <i class="not-italic text-xl mgc_notification_line"></i>
        </button>
        <button
          type="button"
          class="w-8 h-8 border-0 bg-transparent text-primary-600 rounded-full! inline-flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-primary-50"
          aria-label="Perfil"
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
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class GynoTopbarComponent {
  @Input() title: string = '';
}
