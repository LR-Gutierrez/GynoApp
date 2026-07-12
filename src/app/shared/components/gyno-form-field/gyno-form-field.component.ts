import { Component, input, model, effect, ElementRef, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaskitoDirective } from '@maskito/angular';
import type { MaskitoOptions } from '@maskito/core';

@Component({
  selector: 'gyno-form-field',
  templateUrl: './gyno-form-field.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MaskitoDirective],
  host: { style: 'display: block' },
})
export class GynoFormFieldComponent {
  private el = inject(ElementRef);

  readonly label = input.required<string>();
  readonly type = input<'text' | 'number' | 'email' | 'tel' | 'password' | 'textarea'>('text');
  readonly placeholder = input<string>('');
  readonly error = input<string>('');
  readonly icon = input<string>('');
  readonly value = model<string>('');
  readonly mask = input<MaskitoOptions | null>(null);
  readonly showPassword = model(false);

  constructor() {
    effect(() => {
      if (this.error()) {
        setTimeout(() => {
          this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    });
  }
}
