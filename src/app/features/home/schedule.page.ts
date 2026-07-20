import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { GynoTopbarComponent } from 'src/app/shared/components/gyno-topbar/gyno-topbar.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { Consultation, ConsultationStatus } from 'src/app/shared/models/patient.model';

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
  private consultationService = inject(ConsultationService);
  private patientService = inject(PatientService);
  private alertCtrl = inject(AlertController);

  readonly consultationsByDate = signal<Record<string, Consultation[]>>({});
  readonly dayConsultations = signal<Consultation[]>([]);
  private patientNames: Record<string, string> = {};

  async ionViewWillEnter() {
    await this.loadConsultations();
  }

  private async loadConsultations() {
    const [all, patients] = await Promise.all([
      this.consultationService.getAll(),
      this.patientService.getAll(),
    ]);
    this.patientNames = {};
    for (const p of patients) {
      this.patientNames[p.id] = p.name;
    }
    const byDate: Record<string, Consultation[]> = {};
    for (const c of all) {
      const [y, m, d] = c.date.split('-');
      const dateKey = `${y}-${parseInt(m)}-${parseInt(d)}`;
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(c);
    }
    this.consultationsByDate.set(byDate);
  }

  patientName(patientId: string): string {
    return this.patientNames[patientId] ?? '—';
  }

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
    editable: false,
    displayEventTime: false,
    dateClick: (arg: DateClickArg) => this.onDateClick(arg),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
  };

  readonly calendarEvents = computed(() => {
    const events: {
      id: string;
      title: string;
      start: string;
      className: string;
      backgroundColor: string;
      borderColor: string;
      textColor: string;
      extendedProps: { consultationId: string; patientId: string; status: string; time: string; patientName: string; motivo: string };
    }[] = [];
    for (const [dateKey, cons] of Object.entries(this.consultationsByDate())) {
      const [y, m, d] = dateKey.split('-');
      const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      for (const c of cons) {
        const colorMap: Record<string, { bg: string; cls: string }> = {
          programada: { bg: '#0f52ba', cls: 'fc-event-scheduled' },
          atendida: { bg: '#008a85', cls: 'fc-event-completed' },
          cancelada: { bg: '#737784', cls: 'fc-event-cancelled' },
        };
        const color = colorMap[c.status] ?? colorMap['programada'];
        const time = c.time ?? '00:00';
        events.push({
          id: c.id,
          title: `${time} ${c.motivo}`,
          start: `${isoDate}T${time}:00`,
          className: color.cls,
          backgroundColor: color.bg,
          borderColor: color.bg,
          textColor: '#ffffff',
          extendedProps: {
            consultationId: c.id,
            patientId: c.patientId,
            status: c.status,
            time,
            patientName: '',
            motivo: c.motivo,
          },
        });
      }
    }
    return events;
  });

  readonly selectedDisplay = computed(() => {
    const key = this.selectedDateStr();
    if (!key) return null;
    const [y, m, d] = key.split('-');
    return { day: d, month: this.months[parseInt(m) - 1], year: y };
  });

  onDateClick(arg: DateClickArg) {
    const dt = arg.date;
    const dateKey = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
    this.selectedDateStr.set(dateKey);
    this.dayConsultations.set(this.consultationsByDate()[dateKey] ?? []);
  }

  openConsultation(c: Consultation) {
    this.router.navigate(['/home/patient', c.patientId, 'consultation', c.id]);
  }

  async onEventClick(arg: EventClickArg) {
    const consultationId = arg.event.extendedProps['consultationId'] as string;
    const patientId = arg.event.extendedProps['patientId'] as string;
    this.router.navigate(['/home/patient', patientId, 'consultation', consultationId]);
  }

  addAppointment() {
    const key = this.selectedDateStr();
    let dateParam: string;
    if (key) {
      const [y, m, d] = key.split('-');
      dateParam = `${y}-${String(parseInt(m)).padStart(2, '0')}-${d.padStart(2, '0')}`;
    } else {
      const now = new Date();
      dateParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    this.router.navigate(['/home/schedule/new'], {
      queryParams: { date: dateParam },
    });
  }

  editConsultation(c: Consultation) {
    this.router.navigate(['/home/patient', c.patientId, 'consultation', 'new'], {
      queryParams: { edit: c.id, markAttended: 'true' },
    });
  }

  async markAsCancelled(consultationId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar consulta',
      message: '¿Estás segura de cancelar esta consulta?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: async () => {
            await this.consultationService.updateStatus(consultationId, 'cancelada');
            await this.loadConsultations();
            this.refreshDay();
          },
        },
      ],
    });
    await alert.present();
  }

  private refreshDay() {
    const key = this.selectedDateStr();
    if (key) {
      this.dayConsultations.set(this.consultationsByDate()[key] ?? []);
    }
  }

  statusLabel(status: ConsultationStatus): string {
    switch (status) {
      case 'programada': return 'Programada';
      case 'atendida': return 'Atendida';
      case 'cancelada': return 'Cancelada';
    }
  }
}
