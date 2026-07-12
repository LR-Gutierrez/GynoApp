import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { CalendarOptions, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { GynoTopbarComponent } from 'src/app/shared/components/gyno-topbar/gyno-topbar.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { AppointmentService, Appointment } from 'src/app/shared/services/appointment.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FullCalendarModule,
    GynoTopbarComponent,
    GynoBottomNavComponent,
  ],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class SchedulePage {
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);

  protected readonly dayGridPlugin = dayGridPlugin;
  protected readonly interactionPlugin = interactionPlugin;
  protected readonly esLocale = esLocale;

  readonly selectedDateStr = signal<string | null>(null);

  readonly months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  readonly calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    firstDay: 1,
    height: 'auto',
    editable: true,
    dateClick: (arg: DateClickArg) => this.onDateClick(arg),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDrop: (arg: EventDropArg) => this.onEventDrop(arg),
  };

  readonly appointmentsByDate = this.appointmentService.appointmentsByDate;

  readonly calendarEvents = computed(() => {
    const events: {
      id: string;
      title: string;
      start: string;
      className: string;
      backgroundColor: string;
      borderColor: string;
      textColor: string;
      extendedProps: { patientId: string; status: string; time: string; patientName: string; reason: string };
    }[] = [];
    for (const [dateKey, appts] of Object.entries(this.appointmentsByDate())) {
      const [y, m, d] = dateKey.split('-');
      const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      for (const appt of appts) {
        const colorMap: Record<string, { bg: string; cls: string }> = {
          scheduled: { bg: '#0f52ba', cls: 'fc-event-scheduled' },
          completed: { bg: '#008a85', cls: 'fc-event-completed' },
          cancelled: { bg: '#737784', cls: 'fc-event-cancelled' },
        };
        const color = colorMap[appt.status] ?? colorMap['scheduled'];
        events.push({
          id: appt.id,
          title: `${appt.time} ${appt.patientName}`,
          start: `${isoDate}T${appt.time}:00`,
          className: color.cls,
          backgroundColor: color.bg,
          borderColor: color.bg,
          textColor: '#ffffff',
          extendedProps: {
            patientId: appt.patientId,
            status: appt.status,
            time: appt.time,
            patientName: appt.patientName,
            reason: appt.reason,
          },
        });
      }
    }
    return events;
  });

  readonly dayAppointments = computed(() => {
    const key = this.selectedDateStr();
    if (!key) return [];
    return this.appointmentsByDate()[key] ?? [];
  });

  readonly selectedDisplay = computed(() => {
    const key = this.selectedDateStr();
    if (!key) return null;
    const [y, m, d] = key.split('-');
    return { day: d, month: this.months[parseInt(m)], year: y };
  });

  onDateClick(arg: DateClickArg) {
    const dt = arg.date;
    this.selectedDateStr.set(`${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`);
  }

  onEventClick(arg: EventClickArg) {
    const patientId = arg.event.extendedProps['patientId'] as string;
    this.router.navigate(['/home/patient', patientId]);
  }

  onEventDrop(arg: EventDropArg) {
    const apptId = arg.event.id;
    const newStart = arg.event.start;
    if (!newStart) return;

    const newDateKey = `${newStart.getFullYear()}-${newStart.getMonth()}-${newStart.getDate()}`;
    const newTime = `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}`;

    this.appointmentService.appointmentsByDate.update(data => {
      const newData: Record<string, Appointment[]> = {};
      let movedAppt: Appointment | null = null;

      for (const [key, appts] of Object.entries(data)) {
        const filtered = appts.filter(a => a.id !== apptId);
        if (filtered.length !== appts.length) {
          movedAppt = appts.find(a => a.id === apptId)!;
        }
        if (filtered.length > 0) {
          newData[key] = filtered;
        }
      }

      if (movedAppt) {
        const updatedAppt = { ...movedAppt, time: newTime };
        newData[newDateKey] = [...(newData[newDateKey] || []), updatedAppt];
      }

      return newData;
    });

    this.selectedDateStr.set(newDateKey);
  }

  addAppointment() {
    const key = this.selectedDateStr();
    let dateParam: string;
    if (key) {
      const [y, m, d] = key.split('-');
      dateParam = `${y}-${String(parseInt(m) + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
    } else {
      dateParam = new Date().toISOString().split('T')[0];
    }
    this.router.navigate(['/home/schedule/new'], {
      queryParams: { date: dateParam },
    });
  }

  openAppointment(appointment: Appointment) {
    this.router.navigate(['/home/patient', appointment.patientId]);
  }

  statusLabel(status: Appointment['status']): string {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
    }
  }
}
