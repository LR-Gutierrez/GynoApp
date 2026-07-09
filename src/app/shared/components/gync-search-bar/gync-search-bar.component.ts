import { Component, input, output, model } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'gync-search-bar',
  templateUrl: './gync-search-bar.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class GyncSearchBarComponent {
  readonly placeholder = input<string>('Buscar...');
  readonly value = model<string>('');

  readonly search = output<string>();

  onInput(event: any) {
    const v = event.target?.value || '';
    this.value.set(v);
    this.search.emit(v);
  }

  clear() {
    this.value.set('');
    this.search.emit('');
  }
}
