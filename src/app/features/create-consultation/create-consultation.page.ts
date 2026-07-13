import { Component, signal, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
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
import { calculateAge } from 'src/app/shared/models/patient.model';

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
export class CreateConsultationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultationService = inject(ConsultationService);
  private encryptedPhotoService = inject(EncryptedPhotoService);
  private patientService = inject(PatientService);

  readonly patientId = signal('');
  readonly patientName = signal('Paciente');
  readonly patientAge = signal(0);
  readonly patientPhone = signal('');
  readonly loadingPatient = signal(true);

  readonly date = signal(new Date().toISOString().split('T')[0]);
  readonly motivo = signal('');
  readonly diagnostico = signal('');
  readonly tratamiento = signal('');
  readonly receta = signal('');
  readonly notas = signal('');
  readonly examenes = signal('');

  readonly media = signal<PendingMedia[]>([]);
  readonly motivoError = signal('');
  readonly saving = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientId.set(id);
      this.loadPatient(id);
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
    this.media.update(m => m.filter(item => item.id !== id));
  }

  goBack() {
    history.back();
  }

  async save() {
    if (!this.motivo().trim()) {
      this.motivoError.set('El motivo de consulta es obligatorio');
      return;
    }
    this.motivoError.set('');

    this.saving.set(true);

    try {
      const consultation = await this.consultationService.create({
        patientId: this.patientId(),
        date: this.date(),
        motivo: this.motivo().trim(),
        diagnostico: this.diagnostico().trim(),
        tratamiento: this.tratamiento().trim(),
        receta: this.receta().trim() || undefined,
        notas: this.notas().trim() || undefined,
        examenes: this.examenes().trim() || undefined,
        photoIds: [],
      });

      const pendingMedia = this.media();
      if (pendingMedia.length > 0) {
        const items = pendingMedia.map(m => ({ dataUrl: m.src, mimeType: m.type === 'video' ? 'video/mp4' : 'image/jpeg' }));
        console.log('Saving photos...', { consultationId: consultation.id, count: items.length });
        const photoIds = await this.encryptedPhotoService.savePhotos(consultation.id, items);
        console.log('Photos saved', { photoIds });
        consultation.photoIds = photoIds;
        await this.consultationService.update(consultation);
        console.log('Consultation updated with photoIds');
      }

      await this.router.navigate(['/home/patient', this.patientId()]);
    } catch (e) {
      console.warn('Could not save consultation', e);
    } finally {
      this.saving.set(false);
    }
  }
}
