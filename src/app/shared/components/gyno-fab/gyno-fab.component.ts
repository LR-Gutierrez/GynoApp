import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-fab',
  template: `
    <ion-fab-button class="fab-button" (click)="clicked.emit()">
      <ion-icon [name]="icon()"></ion-icon>
    </ion-fab-button>
    @if (label()) {
      <ion-label class="font-sans text-xs text-on-surface-variant mt-1 text-center">{{ label() }}</ion-label>
    }
  `,
  standalone: true,
  imports: [IonicModule],
})
export class GynoFabComponent {
  readonly icon = input<string>('add-outline');
  readonly label = input<string>('');

  readonly clicked = output<void>();
}
