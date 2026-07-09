import { Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-section-header',
  template: `
    <h2
      class="flex items-center gap-2 font-sans text-xl font-semibold text-on-surface mb-5 pb-3 border-b-2 border-surface-container-high tracking-tight"
    >
      @if (icon()) {
        <ion-icon [name]="icon()" class="text-[22px] text-primary"></ion-icon>
      }
      {{ title() }}
    </h2>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class GynoSectionHeaderComponent {
  readonly icon = input<string>('');
  readonly title = input.required<string>();
}
