import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';

export interface GynoActionItem {
  value: string;
  label: string;
  icon: string;
  destructive?: boolean;
}

const DEFAULT_ACTIONS: GynoActionItem[] = [
  { value: 'edit', label: 'Editar', icon: 'mgc_edit_2_line' },
  { value: 'history', label: 'Historial', icon: 'mgc_history_anticlockwise_line' },
  { value: 'delete', label: 'Eliminar', icon: 'mgc_delete_back_line', destructive: true },
];

@Component({
  selector: 'gyno-action-popover',
  template: `
    <ion-list class="p-1 bg-surface-container-lowest rounded-xl min-w-40">
      @for (item of actions; track item.value) {
        <ion-item
          button
          lines="none"
          class="action-option"
          [class.action-destructive]="item.destructive"
          (click)="select(item.value)"
        >
          <i slot="start" class="not-italic text-lg mr-3" [class.text-error]="item.destructive" [class.text-on-surface-variant]="!item.destructive" [ngClass]="item.icon"></i>
          <ion-label class="font-sans text-sm font-medium" [class.text-error]="item.destructive" [class.text-on-surface]="!item.destructive">{{ item.label }}</ion-label>
        </ion-item>
      }
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
  imports: [IonicModule, CommonModule],
})
export class GynoActionPopoverComponent {
  private popoverController = inject(PopoverController);
  @Input() patientName = '';
  @Input() actions: GynoActionItem[] = DEFAULT_ACTIONS;

  select(value: string) {
    this.popoverController.dismiss({ action: value });
  }
}
