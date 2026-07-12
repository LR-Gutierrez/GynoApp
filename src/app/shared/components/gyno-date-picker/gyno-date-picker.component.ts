import { Component, input, model, computed, signal, HostListener, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-date-picker',
  templateUrl: './gyno-date-picker.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule],
  host: { style: 'display: block' },
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class GynoDatePickerComponent {
  private el = inject(ElementRef);

  readonly label = input<string>('');
  readonly placeholder = input<string>('Seleccionar fecha');
  readonly error = input<string>('');
  readonly value = model<string>('');

  readonly open = signal(false);
  readonly viewDate = signal(new Date());

  readonly months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  readonly weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  readonly viewYear = computed(() => this.viewDate().getFullYear());
  readonly viewMonth = computed(() => this.viewDate().getMonth());

  readonly daysInMonth = computed(() => {
    return new Date(this.viewYear(), this.viewMonth() + 1, 0).getDate();
  });

  readonly firstDayOfMonth = computed(() => {
    return (new Date(this.viewYear(), this.viewMonth(), 1).getDay() + 6) % 7;
  });

  readonly calendarDays = computed(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < this.firstDayOfMonth(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= this.daysInMonth(); i++) {
      days.push(i);
    }
    return days;
  });

  readonly displayText = computed(() => {
    const v = this.value();
    if (!v) return '';
    const [y, m, d] = v.split('-');
    const date = new Date(+y, +m - 1, +d);
    return `${String(+d).padStart(2, '0')} ${this.months[+m - 1]} ${y}`;
  });

  readonly todayStr = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  isSelected(day: number): boolean {
    const v = this.value();
    if (!v) return false;
    const [y, m, d] = v.split('-');
    return +y === this.viewYear() && +m - 1 === this.viewMonth() && +d === day;
  }

  isToday(day: number): boolean {
    const [y, m, d] = this.todayStr().split('-');
    return +y === this.viewYear() && +m - 1 === this.viewMonth() && +d === day;
  }

  selectDay(day: number) {
    const y = this.viewYear();
    const m = String(this.viewMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    this.value.set(`${y}-${m}-${d}`);
    this.open.set(false);
  }

  prevMonth() {
    this.viewDate.set(new Date(this.viewYear(), this.viewMonth() - 1, 1));
  }

  nextMonth() {
    this.viewDate.set(new Date(this.viewYear(), this.viewMonth() + 1, 1));
  }

  prevYear() {
    this.viewDate.set(new Date(this.viewYear() - 1, this.viewMonth(), 1));
  }

  nextYear() {
    this.viewDate.set(new Date(this.viewYear() + 1, this.viewMonth(), 1));
  }

  toggle() {
    this.open.update(v => !v);
    if (this.open() && this.value()) {
      const [y, m] = this.value().split('-');
      this.viewDate.set(new Date(+y, +m - 1, 1));
    }
  }

  close() {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }
}
