import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GynoAvatarComponent } from '../gyno-avatar/gyno-avatar.component';

export interface StatusChip {
  label: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'gyno-status-card',
  templateUrl: './gyno-status-card.component.html',
  standalone: true,
  imports: [IonicModule, GynoAvatarComponent, NgClass],
})
export class GynoStatusCardComponent {
  readonly name = input.required<string>();
  readonly initials = input.required<string>();
  readonly lastVisit = input.required<string>();
  readonly chips = input<StatusChip[]>([]);

  readonly clicked = output<void>();
}
