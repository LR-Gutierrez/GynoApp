import { Component, model, computed } from '@angular/core';

@Component({
  selector: 'gyno-calendar',
  templateUrl: './gyno-calendar.component.html',
  standalone: true,
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class GynoCalendarComponent {
  readonly viewDate = model(new Date());
  readonly selectedDay = model<number | null>(null);
  readonly daysWithMarkers = model<Set<number>>(new Set());

  readonly months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  readonly weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  readonly viewYear = computed(() => this.viewDate().getFullYear());
  readonly viewMonth = computed(() => this.viewDate().getMonth());

  readonly daysInMonth = computed(() =>
    new Date(this.viewYear(), this.viewMonth() + 1, 0).getDate()
  );

  readonly firstDayOfMonth = computed(() =>
    (new Date(this.viewYear(), this.viewMonth(), 1).getDay() + 6) % 7
  );

  readonly today = computed(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  });

  readonly calendarDays = computed(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < this.firstDayOfMonth(); i++) days.push(null);
    for (let i = 1; i <= this.daysInMonth(); i++) days.push(i);
    return days;
  });

  readonly weekRows = computed(() => {
    const days = this.calendarDays();
    const rows: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  });

  isToday(day: number): boolean {
    const t = this.today();
    return t.year === this.viewYear() && t.month === this.viewMonth() && t.day === day;
  }

  isSelected(day: number): boolean {
    return this.selectedDay() === day;
  }

  hasMarker(day: number): boolean {
    return this.daysWithMarkers().has(day);
  }

  selectDay(day: number) {
    this.selectedDay.set(day);
  }

  prevMonth() {
    this.viewDate.set(new Date(this.viewYear(), this.viewMonth() - 1, 1));
    this.selectedDay.set(null);
  }

  nextMonth() {
    this.viewDate.set(new Date(this.viewYear(), this.viewMonth() + 1, 1));
    this.selectedDay.set(null);
  }

  prevYear() {
    this.viewDate.set(new Date(this.viewYear() - 1, this.viewMonth(), 1));
  }

  nextYear() {
    this.viewDate.set(new Date(this.viewYear() + 1, this.viewMonth(), 1));
  }
}
