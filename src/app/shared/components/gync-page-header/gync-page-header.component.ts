import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gync-page-header',
  templateUrl: './gync-page-header.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GyncPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly showBack = input(false);
  readonly showAction = input(false);

  readonly back = output<void>();
  readonly action = output<MouseEvent>();
}
