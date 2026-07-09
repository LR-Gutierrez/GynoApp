import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gync-empty-state',
  templateUrl: './gync-empty-state.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GyncEmptyStateComponent {
  readonly icon = input<string>('folder-open-outline');
  readonly message = input.required<string>();
  readonly actionLabel = input<string>('');

  readonly action = output<void>();
}
