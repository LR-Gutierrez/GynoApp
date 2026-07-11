import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-section-header',
  template: `
    <div class="flex items-baseline justify-between mb-5 pb-3 border-b-2 border-surface-container-high">
      <h2 class="flex items-center gap-2 font-sans text-xl !font-semibold text-on-surface tracking-tight m-0">
        @if (icon()) {
          <i class="not-italic text-[22px] leading-none text-primary {{ icon() }}"></i>
        }
        {{ title() }}
      </h2>
      @if (actionLabel()) {
        <button
          type="button"
          class="font-sans text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors cursor-pointer bg-transparent border-0 inline-flex items-center gap-1"
          (click)="action.emit()"
        >
          {{ actionLabel() }}
          <i class="not-italic text-sm mgc_arrow_right_line"></i>
        </button>
      }
    </div>
  `,
  standalone: true,
  imports: [IonicModule],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class GynoSectionHeaderComponent {
  readonly icon = input<string>('');
  readonly title = input.required<string>();
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
