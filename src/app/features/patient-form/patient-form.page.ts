import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { PatientService } from 'src/app/core/services/patient.service';
import { CanComponentDeactivate } from 'src/app/core/guards/can-deactivate.guard';
import { calculateFPP, gestacionalWeeks } from 'src/app/shared/models/patient.model';

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

        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 mt-4">
          <h2 class="font-sans text-base font-semibold text-on-surface m-0 mb-5 flex items-center gap-2">
            <i class="not-italic text-lg text-primary-600 mgc_baby_line"></i>
            Embarazo y obstetricia
          </h2>

          <div class="flex items-center gap-3 mb-4 cursor-pointer" (click)="toggleEmbarazada()">
            <ion-toggle
              [(ngModel)]="embarazada"
              (ionChange)="markDirty()"
              (click)="$event.stopPropagation()"
              color="primary"
            ></ion-toggle>
            <span class="font-sans text-sm text-on-surface">Paciente embarazada</span>
          </div>

          @if (embarazada) {
            <div class="flex flex-col gap-4">
              <div>
                <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5" title="Fecha de Última Regla">FUR</label>
                <input
                  type="date"
                  [value]="FUR"
                  (input)="onFURInput($event)"
                  class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
                />
              </div>

              @if (FUR) {
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5" title="Fecha Probable de Parto">FPP</label>
                    <input
                      type="date"
                      [value]="computedFPP"
                      readonly
                      class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface outline-none opacity-70"
                    />
                  </div>
                  <div>
                    <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">Semanas de gestación</label>
                    <div class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface flex items-center">
                      {{ semanasGestacion !== null ? semanasGestacion + ' semanas' : '—' }}
                    </div>
                  </div>
                </div>
              }

              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-3">Antecedentes obstétricos</label>
              <div class="grid grid-cols-2 gap-2">
                <div class="stepper-item" *ngFor="let field of obFields; trackBy: trackByField">
                  <button type="button" class="stepper-btn" (click)="decField(field.key)" aria-label="Disminuir {{ field.label }}">
                    <i class="not-italic mgc_minus_line"></i>
                  </button>
                  <div class="stepper-value">
                    <span class="stepper-num">{{ field.value }}</span>
                    <span class="stepper-label">{{ field.label }}</span>
                  </div>
                  <button type="button" class="stepper-btn" (click)="incField(field.key)" aria-label="Aumentar {{ field.label }}">
                    <i class="not-italic mgc_add_line"></i>
                  </button>
                </div>
              </div>

              <div class="gpca-badge">
                G{{ gestas }} · P{{ partos }} · C{{ cesareas }} · A{{ abortos }}
              </div>
            </div>
          }
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
      .stepper-item {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--color-surface-container-low, #f0f3ff);
        border: 1px solid var(--color-outline-variant, #e2e8f0);
        border-radius: 12px;
        padding: 6px 10px;
      }
      .stepper-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1.5px solid var(--color-primary-600, #0f52ba);
        background: transparent;
        color: var(--color-primary-600, #0f52ba);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
        padding: 0;
        line-height: 1;
      }
      .stepper-btn:hover {
        background: var(--color-primary-600, #0f52ba);
        color: #fff;
      }
      .stepper-btn:active {
        transform: scale(0.92);
      }
      .stepper-btn i { font-size: 16px; }
      .stepper-value {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
        min-width: 0;
      }
      .stepper-num {
        font-size: 20px;
        font-weight: 700;
        font-family: ui-monospace, monospace;
        color: var(--color-on-surface, #1a1d29);
        line-height: 1.2;
      }
      .stepper-label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-on-surface-variant, #434653);
        line-height: 1;
      }
      .gpca-badge {
        font-family: ui-monospace, monospace;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        background: transparent;
        color: var(--color-primary-600, #0f52ba);
        border: 1.5px solid var(--color-primary-600, #0f52ba);
        padding: 10px;
        border-radius: 12px;
        letter-spacing: 0.08em;
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

  embarazada = false;
  FUR = '';
  FPP = '';
  gestas = 0;
  partos = 0;
  cesareas = 0;
  abortos = 0;
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
        this.embarazada = patient.embarazada ?? false;
        this.FUR = patient.FUR ?? '';
        this.FPP = patient.FPP ?? '';
        this.gestas = patient.gestas ?? 0;
        this.partos = patient.partos ?? 0;
        this.cesareas = patient.cesareas ?? 0;
        this.abortos = patient.abortos ?? 0;
      }
    }
    this.initialValues = { name: this.name, cedula: this.cedula, birthDate: this.birthDate, phone: this.phone, address: this.address, antecedentes: this.antecedentes, alergias: this.alergias, embarazada: String(this.embarazada), FUR: this.FUR, FPP: this.FPP, gestas: String(this.gestas), partos: String(this.partos), cesareas: String(this.cesareas), abortos: String(this.abortos) };
  }

  markDirty() {
    this.dirty = true;
  }

  toggleEmbarazada() {
    this.embarazada = !this.embarazada;
    this.markDirty();
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

  get computedFPP(): string {
    return this.FUR ? calculateFPP(this.FUR) : '';
  }

  get semanasGestacion(): number | null {
    return this.FUR ? gestacionalWeeks(this.FUR) : null;
  }

  onFURInput(event: Event) {
    this.FUR = (event.target as HTMLInputElement).value;
    this.FPP = this.computedFPP;
    this.markDirty();
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
      const commonData = {
        name: this.name.trim(),
        cedula: this.cedula,
        birthDate: this.birthDate,
        phone: this.phone.trim(),
        address: this.address.trim() || undefined,
        antecedentes: this.antecedentes.trim() || undefined,
        alergias: this.alergias.trim() || undefined,
        embarazada: this.embarazada,
        FUR: this.embarazada ? this.FUR || undefined : undefined,
        FPP: this.embarazada ? this.computedFPP || undefined : undefined,
        gestas: this.gestas || undefined,
        partos: this.partos || undefined,
        cesareas: this.cesareas || undefined,
        abortos: this.abortos || undefined,
      };

      if (this.isEditing && this.editingId) {
        await this.patientService.update({
          id: this.editingId,
          ...commonData,
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
        const patient = await this.patientService.create(commonData);
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

  get obFields() {
    return [
      { key: 'gestas' as const, label: 'Gestas', value: this.gestas },
      { key: 'partos' as const, label: 'Partos', value: this.partos },
      { key: 'cesareas' as const, label: 'Cesáreas', value: this.cesareas },
      { key: 'abortos' as const, label: 'Abortos', value: this.abortos },
    ];
  }

  trackByField(_: number, f: { key: string }) { return f.key; }

  incField(key: string) {
    const prev = (this as any)[key] as number;
    (this as any)[key] = Math.min(prev + 1, 50);
    this.markDirty();
  }

  decField(key: string) {
    const prev = (this as any)[key] as number;
    (this as any)[key] = Math.max(prev - 1, 0);
    this.markDirty();
  }
}
