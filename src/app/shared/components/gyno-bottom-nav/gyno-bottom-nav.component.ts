import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { setNavDirection } from 'src/app/core/utils/navigation-animation';

@Component({
  selector: 'gyno-bottom-nav',
  template: `
    <div
      class="flex items-center justify-around bg-surface-container-lowest border-t border-outline-variant/50 px-2 py-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style="padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px))"
    >
      @for (tab of tabs; track tab.route) {
        <button
          type="button"
          class="flex items-center justify-center px-4 py-1.5 border-0 bg-transparent cursor-pointer transition-colors duration-200"
          [class.text-primary-600]="isActive(tab.route)"
          (click)="goTo(tab.route)"
        >
          <i
            class="not-italic text-[22px] leading-none transition-colors duration-200"
            [class]="isActive(tab.route) ? tab.iconFill : tab.iconLine"
            [class.text-primary-600]="isActive(tab.route)"
          ></i>
        </button>
      }
    </div>
  `,
  standalone: true,
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
  private router = inject(Router);

  readonly tabs = [
    {
      route: '/home',
      iconFill: 'mgc_home_4_fill',
      iconLine: 'mgc_home_4_line',
    },
    {
      route: '/home/schedule',
      iconFill: 'mgc_calendar_fill',
      iconLine: 'mgc_calendar_line',
    },
    {
      route: '/home/settings',
      iconFill: 'mgc_settings_1_fill',
      iconLine: 'mgc_settings_1_line',
    },
  ];

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  goTo(route: string) {
    if (this.router.url === route) return;

    if (route === '/home') {
      setNavDirection('back');
    } else {
      setNavDirection('forward');
    }

    this.router.navigate([route]);
  }
}
