import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'gyno-bottom-nav',
  template: `
    <div
      class="flex items-center justify-around bg-surface-container-lowest border-t border-outline-variant/50 px-2 py-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
    >
      @for (tab of tabs; track tab.route) {
        <a
          [routerLink]="tab.route"
          routerLinkActive
          #rla="routerLinkActive"
          class="flex items-center justify-center px-4 py-1.5 no-underline transition-colors duration-200"
          [class.text-primary-600]="rla.isActive"
          [routerLinkActiveOptions]="{ exact: tab.exact }"
        >
          <i
            class="not-italic text-[22px] leading-none transition-colors duration-200"
            [class]="rla.isActive ? tab.iconFill : tab.iconLine"
            [class.text-primary-600]="rla.isActive"
          ></i>
        </a>
      }
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
export class GynoBottomNavComponent {
  readonly tabs = [
    {
      route: '/home',
      iconFill: 'mgc_home_4_fill',
      iconLine: 'mgc_home_4_line',
      label: 'Inicio',
      exact: true,
    },
    {
      route: '/home/schedule',
      iconFill: 'mgc_calendar_fill',
      iconLine: 'mgc_calendar_line',
      label: 'Agenda',
      exact: false,
    },
    {
      route: '/home/settings',
      iconFill: 'mgc_settings_1_fill',
      iconLine: 'mgc_settings_1_line',
      label: 'Ajustes',
      exact: false,
    },
  ];
}
