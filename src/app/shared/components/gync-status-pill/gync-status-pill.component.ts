import { Component, input } from '@angular/core';

@Component({
  selector: 'gync-status-pill',
  template: `
    <span
      class="inline-flex items-center justify-center min-h-6 px-3 py-1 rounded-full font-sans text-xs font-semibold leading-none border whitespace-nowrap"
      [class.bg-[#d7f7f2]]="variant() === 'success'"
      [class.text-[#0b7c75]]="variant() === 'success'"
      [class.border-[#b8ebe3]]="variant() === 'success'"
      [class.bg-[#ffd9dc]]="variant() === 'danger'"
      [class.text-[#a53b45]]="variant() === 'danger'"
      [class.border-[#f3bec2]]="variant() === 'danger'"
      [class.bg-[#dde4ff]]="variant() === 'info'"
      [class.text-[#6170b0]]="variant() === 'info'"
      [class.border-[#c7d1f8]]="variant() === 'info'"
      [class.bg-[#f5f0d5]]="variant() === 'warning'"
      [class.text-[#8a6f00]]="variant() === 'warning'"
      [class.border-[#e3dbb5]]="variant() === 'warning'"
      [class.bg-[#e8e8ed]]="variant() === 'neutral'"
      [class.text-[#5d6472]]="variant() === 'neutral'"
      [class.border-[#d1d1d8]]="variant() === 'neutral'"
    >
      {{ label() }}
    </span>
  `,
  standalone: true,
})
export class GyncStatusPillComponent {
  readonly label = input.required<string>();
  readonly variant = input<'success' | 'danger' | 'info' | 'warning' | 'neutral'>('info');
}
