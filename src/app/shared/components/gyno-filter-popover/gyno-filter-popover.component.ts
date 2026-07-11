import { Component, inject, Input } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';

@Component({
  selector: 'gyno-filter-popover',
  template: `
    <ion-list class="p-1 bg-surface-container-lowest rounded-xl min-w-45">
      <ion-item
        button
        class="filter-option"
        [class.filter-active]="activeFilter === 'date'"
        (click)="select('date')"
      >
        <i
          slot="start"
          class="not-italic text-lg text-on-surface-variant mr-3 mgc_calendar_line"
        ></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium"
          >Por fecha</ion-label
        >
      </ion-item>
      <ion-item
        button
        class="filter-option"
        [class.filter-active]="activeFilter === 'name'"
        (click)="select('name')"
      >
        <i
          slot="start"
          class="not-italic text-lg text-on-surface-variant mr-3 mgc_AZ_sort_ascending_letters_line"
        ></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium"
          >Por nombre</ion-label
        >
      </ion-item>
      <ion-item
        button
        class="filter-option"
        [class.filter-active]="activeFilter === 'status'"
        (click)="select('status')"
      >
        <i
          slot="start"
          class="not-italic text-lg text-on-surface-variant mr-3 mgc_filter_2_line"
        ></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium"
          >Por estado</ion-label
        >
      </ion-item>
      <ion-item
        button
        lines="none"
        class="filter-option"
        [class.filter-active]="activeFilter === 'clear'"
        (click)="select('clear')"
      >
        <i
          slot="start"
          class="not-italic text-lg text-on-surface-variant mr-3 mgc_close_circle_line"
        ></i>
        <ion-label class="font-sans text-sm text-on-surface font-medium"
          >Limpiar filtros</ion-label
        >
      </ion-item>
    </ion-list>
  `,
  styles: [
    `
      .filter-option {
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
      .filter-option:last-child {
        margin-bottom: 0;
      }
      .filter-active {
        --background: var(--color-surface-container-low);
        border: 1px solid var(--color-primary-600);
        box-shadow: 0 4px 12px rgba(15, 82, 186, 0.08);
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
export class GynoFilterPopoverComponent {
  private popoverController = inject(PopoverController);
  @Input() activeFilter: string = '';

  select(value: string) {
    this.popoverController.dismiss({ filter: value });
  }
}
