import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-loading-button',
  template: `
    <ion-button
      class="btn-primary w-full"
      [disabled]="disabled() || isLoading()"
      (click)="clicked.emit()"
    >
      @if (isLoading()) {
        <ion-spinner name="crescent" slot="start"></ion-spinner>
      } @else if (icon()) {
        <i class="not-italic text-lg mr-1 {{ icon() }}" slot="start"></i>
      }
      {{ isLoading() ? loadingLabel() : label() }}
    </ion-button>
  `,
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
export class GynoLoadingButtonComponent {
  readonly label = input.required<string>();
  readonly loadingLabel = input<string>('');
  readonly icon = input<string>('');
  readonly isLoading = input(false);
  readonly disabled = input(false);
  readonly clicked = output<void>();
}
