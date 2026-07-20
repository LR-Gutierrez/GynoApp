import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { PatientService } from 'src/app/core/services/patient.service';
import { CanComponentDeactivate } from 'src/app/core/guards/can-deactivate.guard';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    GynoPageHeaderComponent,
  ],
  template: `
    <gyno-page-header [title]="isEditing ? 'Editar paciente' : 'Nuevo paciente'" [showBack]="true" (back)="goBack()" />

    <ion-content>
      <div class="px-4 pt-4 pb-8 flex flex-col gap-4">
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
          <h2 class="font-sans text-base font-semibold text-on-surface m-0 mb-5 flex items-center gap-2">
            <i class="not-italic text-lg text-primary-600 mgc_user_3_line"></i>
            Información del paciente
          </h2>

          <div class="flex flex-col gap-4">
            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Nombre completo <span class="text-error">*</span>
              </label>
              <input
                [(ngModel)]="name"
                (input)="markDirty()"
                placeholder="ej. María García"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Cédula <span class="text-error">*</span>
              </label>
              <input
                [value]="cedula"
                (input)="onCedulaInput($event); markDirty()"
                (blur)="onCedulaBlur()"
                placeholder="ej. V-12345678"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
              @if (cedulaError) {
                <p class="font-sans text-xs text-error mt-1">{{ cedulaError }}</p>
              }
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Fecha de nacimiento <span class="text-error">*</span>
              </label>
              <input
                type="date"
                [(ngModel)]="birthDate"
                (input)="markDirty()"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
              @if (birthDate) {
                <p class="font-sans text-xs text-on-surface-variant mt-1">{{ age }} años</p>
              }
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Teléfono <span class="text-error">*</span>
              </label>
              <input
                [(ngModel)]="phone"
                (input)="markDirty()"
                placeholder="ej. +58 412-1234567"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Dirección
              </label>
              <input
                [(ngModel)]="address"
                (input)="markDirty()"
                placeholder="ej. Av. Principal, Caracas"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Antecedentes
              </label>
              <textarea
                [(ngModel)]="antecedentes"
                (input)="markDirty()"
                placeholder="Antecedentes médicos relevantes..."
                rows="3"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none resize-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              ></textarea>
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Alergias
              </label>
              <textarea
                [(ngModel)]="alergias"
                (input)="markDirty()"
                placeholder="Alergias conocidas..."
                rows="2"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none resize-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              ></textarea>
            </div>
          </div>
        </div>

        <ion-button
          class="w-full"
          [disabled]="!isValid() || saving"
          (click)="save()"
        >
          @if (saving) {
            <ion-spinner name="dots" class="w-5 h-5" />
          }
          {{ saving ? 'Guardando...' : 'Guardar paciente' }}
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
      ::placeholder {
        color: #9ca3af;
      }
    `,
  ],
})
export class PatientFormPage implements OnInit, CanComponentDeactivate {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private toastCtrl = inject(ToastController);

  name = '';
  cedula = '';
  birthDate = '';
  phone = '';
  address = '';
  antecedentes = '';
  alergias = '';
  saving = false;
  cedulaError = '';
  isEditing = false;
  private editingId: string | null = null;
  private initialValues: Record<string, string> = {};
  private dirty = false;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.editingId = id;
      const patient = await this.patientService.getById(id);
      if (patient) {
        this.name = patient.name;
        this.cedula = patient.cedula ?? '';
        this.birthDate = patient.birthDate;
        this.phone = patient.phone;
        this.address = patient.address ?? '';
        this.antecedentes = patient.antecedentes ?? '';
        this.alergias = patient.alergias ?? '';
      }
    }
    this.initialValues = { name: this.name, cedula: this.cedula, birthDate: this.birthDate, phone: this.phone, address: this.address, antecedentes: this.antecedentes, alergias: this.alergias };
  }

  markDirty() {
    this.dirty = true;
  }

  canDeactivate(): boolean {
    if (this.saving) return true;
    if (!this.dirty) return true;
    return Object.keys(this.initialValues).every(k => (this as any)[k] === this.initialValues[k]);
  }

  get age(): number | null {
    if (!this.birthDate) return null;
    const today = new Date();
    const birth = new Date(this.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private async showSavedToast() {
    const toast = await this.toastCtrl.create({
      message: this.isEditing ? 'Paciente actualizado' : 'Paciente registrado',
      duration: 2000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle',
    });
    await toast.present();
  }

  isValid(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.cedula.trim().length > 0 &&
      this.birthDate.length > 0 &&
      this.phone.trim().length > 0 &&
      !this.cedulaError
    );
  }

  onCedulaInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/[^a-zA-Z0-9]/g, '');
    const formatted = this.formatCedula(raw);
    this.cedula = formatted;
    input.value = formatted;
    this.cedulaError = '';
  }

  onCedulaBlur() {
    this.cedula = this.formatCedula(this.cedula);
  }

  private formatCedula(raw: string): string {
    if (!raw) return '';
    const letter = raw.charAt(0).toUpperCase();
    const numbers = raw.slice(1).replace(/\D/g, '');
    return letter + (numbers ? '-' + numbers : '');
  }

  async save() {
    if (!this.isValid()) return;
    this.saving = true;
    try {
      if (this.isEditing && this.editingId) {
        await this.patientService.update({
          id: this.editingId,
          name: this.name.trim(),
          cedula: this.cedula,
          birthDate: this.birthDate,
          phone: this.phone.trim(),
          address: this.address.trim() || undefined,
          antecedentes: this.antecedentes.trim() || undefined,
          alergias: this.alergias.trim() || undefined,
          createdAt: '',
          updatedAt: '',
        });
        this.dirty = false;
        await this.showSavedToast();
        await this.router.navigate(['/home/patient', this.editingId]);
      } else {
        const existing = await this.patientService.findByCedula(this.cedula);
        if (existing) {
          this.cedulaError = 'Ya existe un paciente con esta cédula';
          this.saving = false;
          return;
        }
        const patient = await this.patientService.create({
          name: this.name.trim(),
          cedula: this.cedula,
          birthDate: this.birthDate,
          phone: this.phone.trim(),
          address: this.address.trim() || undefined,
          antecedentes: this.antecedentes.trim() || undefined,
          alergias: this.alergias.trim() || undefined,
        });
        this.dirty = false;
        await this.showSavedToast();
        await this.router.navigate(['/home/patient', patient.id]);
      }
    } catch (e) {
      console.error('Error al guardar paciente:', e);
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
