import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-empty-state',
  templateUrl: './gyno-empty-state.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GynoEmptyStateComponent {
  readonly icon = input<string>('folder-open-outline');
  readonly message = input.required<string>();
  readonly actionLabel = input<string>('');

  readonly action = output<void>();
}
