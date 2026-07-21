import { Component, signal, computed, inject, HostListener, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';
import { GynoLoadingButtonComponent } from 'src/app/shared/components/gyno-loading-button/gyno-loading-button.component';
import { GynoDatePickerComponent } from 'src/app/shared/components/gyno-date-picker/gyno-date-picker.component';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { calculateAge } from 'src/app/shared/models/patient.model';
import { CanComponentDeactivate } from 'src/app/core/guards/can-deactivate.guard';

@Component({
  selector: 'app-create-appointment',
  templateUrl: './create-appointment.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    GynoPageHeaderComponent,
    GynoFormFieldComponent,
    GynoLoadingButtonComponent,
    GynoDatePickerComponent,
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
export class CreateAppointmentPage implements CanComponentDeactivate {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultationService = inject(ConsultationService);
  private patientService = inject(PatientService);
  protected settings = inject(SettingsService);
  private el = inject(ElementRef);
  private toastCtrl = inject(ToastController);
  private notificationService = inject(NotificationService);

  readonly patients = signal<{ id: string; name: string; age: number; phone: string }[]>([]);

  readonly selectedPatientId = signal('');
  private readonly todayLocal = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
  readonly date = signal(this.todayLocal);
  readonly time = signal('09:00');
  readonly timeFormat = signal<'12h' | '24h'>('24h');
  readonly period = signal<'AM' | 'PM'>('AM');
  readonly reason = signal('');
  readonly reasonError = signal('');
  readonly saving = signal(false);
  readonly dirty = signal(false);
  markDirty() { this.dirty.set(true); }

  canDeactivate(): boolean {
    return !this.dirty() || this.saving();
  }

  private async showSavedToast() {
    const toast = await this.toastCtrl.create({
      message: 'Cita agendada',
      duration: 2000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle',
    });
    await toast.present();
  }
  readonly hours = computed(() => this.settings.hourValues(this.timeFormat()));
  readonly minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  readonly searchQuery = signal('');
  readonly showPatientList = signal(false);
  readonly showTimePicker = signal(false);

  readonly selectedPatient = computed(() =>
    this.patients().find(p => p.id === this.selectedPatientId()) ?? null
  );

  readonly filteredPatients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.patients();
    return this.patients().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  readonly displayTime = computed(() => this.settings.formatTime(this.time(), this.timeFormat()));

  async ionViewWillEnter() {
    this.timeFormat.set(await this.settings.getTimeFormat());
    const tf = this.timeFormat();
    if (tf === '12h') this.period.set(this.settings.hour24to12(this.time().split(':')[0]).period);

    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam) {
      this.date.set(dateParam);
    }
    await this.loadPatients();
  }

  private async loadPatients() {
    const all = await this.patientService.getAll();
    this.patients.set(all.map(p => ({
      id: p.id,
      name: p.name,
      age: calculateAge(p.birthDate),
      phone: p.phone,
    })));
  }

  selectPatient(id: string) {
    this.selectedPatientId.set(id);
    this.showPatientList.set(false);
    this.searchQuery.set('');
    this.markDirty();
  }

  openTimePicker() {
    this.showTimePicker.set(true);
  }

  onHourChange(event: CustomEvent) {
    this.markDirty();
    const val = event.detail.value as string;
    const [, m] = this.time().split(':');
    if (this.timeFormat() === '12h') {
      const h24 = this.settings.hour12to24(val, this.period());
      this.time.set(`${h24}:${m}`);
    } else {
      this.time.set(`${val}:${m}`);
    }
  }

  onMinuteChange(event: CustomEvent) {
    this.markDirty();
    const [h] = this.time().split(':');
    const m = event.detail.value as string;
    this.time.set(`${h}:${m}`);
  }

  onPeriodChange(event: CustomEvent) {
    this.markDirty();
    const period = event.detail.value as 'AM' | 'PM';
    this.period.set(period);
    const [h, m] = this.time().split(':');
    const h24 = this.settings.hour12to24(
      this.settings.hour24to12(h).hour,
      period
    );
    this.time.set(`${h24}:${m}`);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (this.showTimePicker() && !this.el.nativeElement.contains(e.target as Node)) {
      this.showTimePicker.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/home/schedule']);
  }

  async save() {
    if (!this.selectedPatientId()) {
      this.reasonError.set('Debes seleccionar una paciente');
      return;
    }
    if (!this.reason().trim()) {
      this.reasonError.set('El motivo de la cita es obligatorio');
      return;
    }
    this.reasonError.set('');
    this.saving.set(true);

    const patient = this.patients().find(p => p.id === this.selectedPatientId())!;

    const consultation = await this.consultationService.create({
      patientId: patient.id,
      date: this.date(),
      time: this.time(),
      motivo: this.reason().trim(),
      diagnostico: '',
      tratamiento: '',
      photoIds: [],
      status: 'programada',
    });

    await Promise.all([
      this.notificationService.scheduleAppointmentReminder(
        consultation.id, patient.name, this.reason().trim(), this.date(), this.time(),
      ),
      this.notificationService.addNotification(
        'cita_creada',
        'Cita agendada',
        `${patient.name} — ${this.reason().trim()}`,
        { appointmentId: consultation.id, patientId: patient.id },
      ),
    ]);

    await this.showSavedToast();
    this.dirty.set(false);
    this.saving.set(false);
    this.router.navigate(['/home/schedule']);
  }
}
