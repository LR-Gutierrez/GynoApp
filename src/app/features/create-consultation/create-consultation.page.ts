import { Component, signal, computed, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';
import { GynoLoadingButtonComponent } from 'src/app/shared/components/gyno-loading-button/gyno-loading-button.component';
import { GynoDatePickerComponent } from 'src/app/shared/components/gyno-date-picker/gyno-date-picker.component';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { EncryptedPhotoService } from 'src/app/core/services/encrypted-photo.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { calculateAge, ConsultationStatus } from 'src/app/shared/models/patient.model';
import { CanComponentDeactivate } from 'src/app/core/guards/can-deactivate.guard';

interface PendingMedia {
  id: string;
  src: string;
  type: 'image' | 'video';
}

@Component({
  selector: 'app-create-consultation',
  templateUrl: './create-consultation.page.html',
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
export class CreateConsultationPage implements OnInit, CanComponentDeactivate {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultationService = inject(ConsultationService);
  private encryptedPhotoService = inject(EncryptedPhotoService);
  private patientService = inject(PatientService);
  protected settings = inject(SettingsService);
  private el = inject(ElementRef);
  private toastCtrl = inject(ToastController);

  readonly patientId = signal('');
  readonly patientName = signal('Paciente');
  readonly patientAge = signal(0);
  readonly patientPhone = signal('');
  readonly loadingPatient = signal(true);
  readonly isEditing = signal(false);
  private editingConsultationId = '';

  private readonly todayLocal = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
  readonly date = signal(this.todayLocal);
  readonly time = signal('09:00');
  readonly timeFormat = signal<'12h' | '24h'>('24h');
  readonly period = signal<'AM' | 'PM'>('AM');
  readonly showTimePicker = signal(false);
  readonly hours = computed(() => this.settings.hourValues(this.timeFormat()));
  readonly minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  readonly motivo = signal('');
  readonly diagnostico = signal('');
  readonly tratamiento = signal('');
  readonly receta = signal('');
  readonly notas = signal('');
  readonly examenes = signal('');
  readonly status = signal<ConsultationStatus>('atendida');

  readonly displayTime = computed(() => this.settings.formatTime(this.time(), this.timeFormat()));

  readonly markAttended = signal(false);
  readonly media = signal<PendingMedia[]>([]);
  readonly motivoError = signal('');
  readonly saving = signal(false);
  readonly dirty = signal(false);
  markDirty() { this.dirty.set(true); }

  canDeactivate(): boolean {
    return !this.dirty() || this.saving();
  }

  private async showSavedToast() {
    const toast = await this.toastCtrl.create({
      message: this.isEditing() ? 'Consulta actualizada' : 'Consulta guardada',
      duration: 2000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle',
    });
    await toast.present();
  }

  async ngOnInit() {
    const tf = await this.settings.getTimeFormat();
    this.timeFormat.set(tf);
    if (tf === '12h') this.period.set(this.settings.hour24to12(this.time().split(':')[0]).period);

    const id = this.route.snapshot.paramMap.get('id');
    const editId = this.route.snapshot.queryParamMap.get('edit');
    this.markAttended.set(this.route.snapshot.queryParamMap.get('markAttended') === 'true');
    if (id) {
      this.patientId.set(id);
      this.loadPatient(id);
      if (editId) {
        this.loadConsultation(editId);
      }
    }
  }

  private async loadPatient(id: string) {
    try {
      const patient = await this.patientService.getById(id);
      if (patient) {
        this.patientName.set(patient.name);
        this.patientAge.set(calculateAge(patient.birthDate));
        this.patientPhone.set(patient.phone);
      }
    } catch {
      console.warn('Could not load patient');
    } finally {
      this.loadingPatient.set(false);
    }
  }

  private async loadConsultation(consultationId: string) {
    try {
      const c = await this.consultationService.getById(consultationId);
      if (c) {
        this.isEditing.set(true);
        this.editingConsultationId = consultationId;
        this.date.set(c.date);
        const loadedTime = c.time ?? '09:00';
        this.time.set(loadedTime);
        if (this.timeFormat() === '12h') this.period.set(this.settings.hour24to12(loadedTime.split(':')[0]).period);
        this.motivo.set(c.motivo);
        this.diagnostico.set(c.diagnostico);
        this.tratamiento.set(c.tratamiento);
        this.receta.set(c.receta ?? '');
        this.notas.set(c.notas ?? '');
        this.examenes.set(c.examenes ?? '');
        this.status.set(this.markAttended() ? 'atendida' : c.status);
      }
    } catch {
      console.warn('Could not load consultation for editing');
    }
  }

  async addMedia() {
    try {
      const result = await new Promise<{ src: string; type: 'image' | 'video' }>((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) { reject(); return; }
          const detected: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
          const reader = new FileReader();
          reader.onload = () => resolve({ src: reader.result as string, type: detected });
          reader.onerror = () => reject();
          reader.readAsDataURL(file);
        };
        input.oncancel = () => reject();
        input.click();
      });
      const id = 'media_' + Date.now();
      this.media.update(m => [...m, { id, src: result.src, type: result.type }]);
    } catch {
      // user cancelled
    }
  }

  removeMedia(id: string) {
    this.markDirty();
    this.media.update(m => m.filter(item => item.id !== id));
  }

  openTimePicker() {
    this.showTimePicker.set(true);
  }

  onHourChange(event: CustomEvent) {
    this.markDirty();
    const m = this.time().split(':')[1] ?? '00';
    const val = event.detail.value as string;
    if (this.timeFormat() === '12h') {
      const h24 = this.settings.hour12to24(val, this.period());
      this.time.set(`${h24}:${m}`);
    } else {
      this.time.set(`${val}:${m}`);
    }
  }

  onMinuteChange(event: CustomEvent) {
    this.markDirty();
    const h = this.time().split(':')[0] ?? '00';
    this.time.set(`${h}:${event.detail.value}`);
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
    this.router.navigate(['/home/patient', this.patientId()]);
  }

  async save() {
    if (!this.motivo().trim()) {
      this.motivoError.set('El motivo de consulta es obligatorio');
      return;
    }
    this.motivoError.set('');

    this.saving.set(true);

    try {
      const pendingMedia = this.media();

      if (this.isEditing()) {
        const consultation = await this.consultationService.getById(this.editingConsultationId);
        if (!consultation) throw new Error('Consultation not found');

        consultation.date = this.date();
        consultation.time = this.time() || undefined;
        consultation.motivo = this.motivo().trim();
        consultation.diagnostico = this.diagnostico().trim();
        consultation.tratamiento = this.tratamiento().trim();
        consultation.receta = this.receta().trim() || undefined;
        consultation.notas = this.notas().trim() || undefined;
        consultation.examenes = this.examenes().trim() || undefined;
        consultation.status = this.status();

        if (pendingMedia.length > 0) {
          const items = pendingMedia.map(m => ({ dataUrl: m.src, mimeType: m.type === 'video' ? 'video/mp4' : 'image/jpeg' }));
          const photoIds = await this.encryptedPhotoService.savePhotos(consultation.id, items);
          consultation.photoIds = [...consultation.photoIds, ...photoIds];
        }

        await this.consultationService.update(consultation);
        this.dirty.set(false);
      } else {
        const consultation = await this.consultationService.create({
          patientId: this.patientId(),
          date: this.date(),
          time: this.time() || undefined,
          motivo: this.motivo().trim(),
          diagnostico: this.diagnostico().trim(),
          tratamiento: this.tratamiento().trim(),
          receta: this.receta().trim() || undefined,
          notas: this.notas().trim() || undefined,
          examenes: this.examenes().trim() || undefined,
          photoIds: [],
          status: this.status(),
        });

        if (pendingMedia.length > 0) {
          const items = pendingMedia.map(m => ({ dataUrl: m.src, mimeType: m.type === 'video' ? 'video/mp4' : 'image/jpeg' }));
          const photoIds = await this.encryptedPhotoService.savePhotos(consultation.id, items);
          consultation.photoIds = photoIds;
          await this.consultationService.update(consultation);
        }
        this.dirty.set(false);
      }

      await this.showSavedToast();
      await this.router.navigate(['/home/patient', this.patientId()]);
    } catch (e) {
      console.warn('Could not save consultation', e);
    } finally {
      this.saving.set(false);
    }
  }
}
