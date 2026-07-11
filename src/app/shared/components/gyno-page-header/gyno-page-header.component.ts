import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-page-header',
  templateUrl: './gyno-page-header.component.html',
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
  standalone: true,
  imports: [IonicModule],
})
export class GynoPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly showBack = input(false);
  readonly showAction = input(false);

  readonly back = output<void>();
  readonly action = output<MouseEvent>();
}
