import { Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-security-badge',
  templateUrl: './gyno-security-badge.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GynoSecurityBadgeComponent {
  readonly type = input<'active' | 'locked'>('active');
  readonly text = input('Encrypted Session Active');

  get badgeClass(): string {
    return this.type() === 'active'
      ? 'bg-primary-fixed border-primary-600 text-primary-900'
      : 'bg-error-container border-error text-error';
  }

  get iconName(): string {
    return this.type() === 'active' ? 'shield-checkmark-outline' : 'lock-closed-outline';
  }

  get dotColor(): string {
    return this.type() === 'active' ? 'bg-primary-600' : 'bg-error';
  }
}
