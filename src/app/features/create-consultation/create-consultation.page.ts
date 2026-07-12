import { Component, signal, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';
import { GynoLoadingButtonComponent } from 'src/app/shared/components/gyno-loading-button/gyno-loading-button.component';
import { GynoDatePickerComponent } from 'src/app/shared/components/gyno-date-picker/gyno-date-picker.component';

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



  readonly patientId = signal('');
  readonly patientName = signal('Paciente');

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

  readonly patient = {
    id: '1',
    name: 'María García',
    age: 34,
    phone: '+58 412-1234567',
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientId.set(id);
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

  save() {
    if (!this.motivo().trim()) {
      this.motivoError.set('El motivo de consulta es obligatorio');
      return;
    }
    this.motivoError.set('');

    this.saving.set(true);

    const consultation = {
      patientId: this.patientId(),
      date: this.date(),
      motivo: this.motivo().trim(),
      diagnostico: this.diagnostico().trim(),
      tratamiento: this.tratamiento().trim(),
      receta: this.receta().trim(),
      notas: this.notas().trim(),
      examenes: this.examenes().trim(),
      photoIds: [],
      createdAt: new Date().toISOString(),
    };

    console.log('Consulta guardada:', consultation);

    setTimeout(() => {
      this.saving.set(false);
      this.router.navigate(['/home/patient', this.patientId()]);
    }, 800);
  }
}
