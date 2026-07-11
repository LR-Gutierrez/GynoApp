import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-fab',
  template: `
    <ion-fab [vertical]="vertical()" [horizontal]="horizontal()">
      <ion-fab-button class="fab-button" (click)="clicked.emit()">
        <i class="not-italic text-xl !text-white {{ icon() }}"></i>
      </ion-fab-button>
      @if (label()) {
        <ion-label
          class="font-sans text-xs text-on-surface-variant mt-1 text-center"
          >{{ label() }}</ion-label
        >
      }
    </ion-fab>
  `,
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
  host: {
    '[attr.slot]': 'slot()',
  },
  standalone: true,
  imports: [IonicModule],
})
export class GynoFabComponent {
  readonly icon = input<string>('mgc_add_line');
  readonly label = input<string>('');
  readonly vertical = input<'top' | 'bottom' | 'center'>('bottom');
  readonly horizontal = input<'start' | 'end' | 'center'>('end');
  readonly slot = input<string>('fixed');
  readonly clicked = output<void>();
}
