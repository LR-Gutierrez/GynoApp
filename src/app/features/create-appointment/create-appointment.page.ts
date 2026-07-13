import { Component, signal, computed, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';
import { GynoLoadingButtonComponent } from 'src/app/shared/components/gyno-loading-button/gyno-loading-button.component';
import { GynoDatePickerComponent } from 'src/app/shared/components/gyno-date-picker/gyno-date-picker.component';
import { AppointmentService } from 'src/app/shared/services/appointment.service';

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
export class CreateAppointmentPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private el = inject(ElementRef);

  readonly patients = this.appointmentService.patients;

  readonly selectedPatientId = signal('');
  private readonly todayLocal = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
  readonly date = signal(this.todayLocal);
  readonly time = signal('09:00');
  readonly reason = signal('');
  readonly reasonError = signal('');
  readonly saving = signal(false);
  readonly hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  readonly searchQuery = signal('');
  readonly showPatientList = signal(false);
  readonly showTimePicker = signal(false);

  readonly selectedPatient = computed(() =>
    this.patients.find(p => p.id === this.selectedPatientId()) ?? null
  );

  readonly filteredPatients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.patients;
    return this.patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  ngOnInit() {
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam) {
      this.date.set(dateParam);
    }
  }

  selectPatient(id: string) {
    this.selectedPatientId.set(id);
    this.showPatientList.set(false);
    this.searchQuery.set('');
  }

  openTimePicker() {
    this.showTimePicker.set(true);
  }

  onHourChange(event: CustomEvent) {
    const h = event.detail.value as string;
    const [, m] = this.time().split(':');
    this.time.set(`${h}:${m}`);
  }

  onMinuteChange(event: CustomEvent) {
    const [h] = this.time().split(':');
    const m = event.detail.value as string;
    this.time.set(`${h}:${m}`);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (this.showTimePicker() && !this.el.nativeElement.contains(e.target as Node)) {
      this.showTimePicker.set(false);
    }
  }

  goBack() {
    history.back();
  }

  save() {
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

    const patient = this.patients.find(p => p.id === this.selectedPatientId())!;

    this.appointmentService.addAppointment({
      date: this.date(),
      time: this.time(),
      patientId: patient.id,
      patientName: patient.name,
      reason: this.reason().trim(),
      status: 'scheduled',
    });

    setTimeout(() => {
      this.saving.set(false);
      this.router.navigate(['/home/schedule']);
    }, 600);
  }
}
