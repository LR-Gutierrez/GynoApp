import { Component, inject, input } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';

@Component({
  selector: 'gyno-action-popover',
  template: `
    <ion-list class="p-1 bg-surface-container-lowest rounded-xl min-w-40">
      <ion-item button class="action-option" (click)="select('profile')">
        <i slot="start" class="not-italic text-lg text-on-surface-variant mr-3 mgc_user_1_line"></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium">Ver perfil</ion-label>
      </ion-item>
      <ion-item button class="action-option" (click)="select('edit')">
        <i slot="start" class="not-italic text-lg text-on-surface-variant mr-3 mgc_edit_2_line"></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium">Editar</ion-label>
      </ion-item>
      <ion-item button class="action-option" (click)="select('history')">
        <i slot="start" class="not-italic text-lg text-on-surface-variant mr-3 mgc_history_anticlockwise_line"></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium">Historial</ion-label>
      </ion-item>
      <ion-item button lines="none" class="action-option" (click)="select('delete')">
        <i slot="start" class="not-italic text-lg text-on-surface-variant mr-3 mgc_delete_back_line"></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium">Eliminar</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: [
    `
      .action-option {
        --background: transparent;
        --background-hover: var(--color-surface-container-low);
        --background-activated: var(--color-surface-container-low);
        --border-color: var(--color-outline-variant);
        --padding-start: 12px;
        --padding-end: 12px;
        --min-height: 44px;
        border-radius: 0.5rem;
        margin-bottom: 2px;
      }
      .action-option:last-child {
        margin-bottom: 0;
      }
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
  standalone: true,
  imports: [IonicModule],
})
export class GynoActionPopoverComponent {
  private popoverController = inject(PopoverController);
  readonly patientName = input<string>('');

  select(value: string) {
    this.popoverController.dismiss({ action: value });
  }
}
