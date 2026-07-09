import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GyncAvatarComponent } from '../gync-avatar/gync-avatar.component';

export interface StatusChip {
  label: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'gync-status-card',
  templateUrl: './gync-status-card.component.html',
  standalone: true,
  imports: [IonicModule, GyncAvatarComponent, NgClass],
})
export class GyncStatusCardComponent {
  readonly name = input.required<string>();
  readonly initials = input.required<string>();
  readonly lastVisit = input.required<string>();
  readonly chips = input<StatusChip[]>([]);

  readonly clicked = output<void>();
}
