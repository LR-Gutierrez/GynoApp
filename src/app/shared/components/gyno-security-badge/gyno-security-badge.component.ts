import { Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-security-badge',
  templateUrl: './gyno-security-badge.component.html',
  standalone: true,
  imports: [IonicModule],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class GynoSecurityBadgeComponent {
  readonly type = input<'active' | 'locked'>('active');
  readonly text = input('Encrypted Session Active');

  get badgeClass(): string {
    return this.type() === 'active'
      ? 'bg-primary-fixed border-primary-600 text-primary-900'
      : 'bg-error-container border-error text-error';
  }

  get iconClass(): string {
    return this.type() === 'active' ? 'mgc_shield_line' : 'mgc_lock_line';
  }

  get dotColor(): string {
    return this.type() === 'active' ? 'bg-primary-600' : 'bg-error';
  }
}
