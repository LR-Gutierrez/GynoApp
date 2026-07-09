import { Component, input, model } from '@angular/core';
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
})
export class GynoFormFieldComponent {
  readonly label = input.required<string>();
  readonly type = input<'text' | 'number' | 'email' | 'tel' | 'textarea'>('text');
  readonly placeholder = input<string>('');
  readonly error = input<string>('');
  readonly icon = input<string>('');
  readonly value = model<string>('');
  readonly mask = input<MaskitoOptions | null>(null);
}
