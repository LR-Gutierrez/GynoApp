import { Component, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType } from '@capacitor/camera';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { DoctorProfileService } from 'src/app/shared/services/doctor-profile.service';
import type { DoctorProfile } from 'src/app/shared/models/doctor.model';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    GynoPageHeaderComponent,
  ],
  template: `
    <gyno-page-header title="Editar perfil" subtitle="Actualiza tu información profesional" [showBack]="true" (back)="goBack()" />

    <ion-content>
      @if (profileService.loading()) {
        <div class="px-4 pt-4 pb-8 flex flex-col gap-6 animate-pulse">
          <div class="flex flex-col items-center gap-3">
            <div class="w-24 h-24 rounded-full bg-outline-variant"></div>
            <div class="h-3 bg-outline-variant rounded w-44"></div>
          </div>

          <div class="flex flex-col gap-4">
            @for (item of skeletonFields; track item) {
              <div>
                <div class="h-3 bg-outline-variant rounded w-20 mb-1.5"></div>
                <div class="h-[46px] bg-outline-variant rounded-xl w-full"></div>
              </div>
            }
            <div>
              <div class="h-3 bg-outline-variant rounded w-28 mb-1.5"></div>
              <div class="h-[74px] bg-outline-variant rounded-xl w-full"></div>
            </div>
            <div>
              <div class="h-3 bg-outline-variant rounded w-24 mb-1.5"></div>
              <div class="h-[46px] bg-outline-variant rounded-xl w-full"></div>
            </div>
          </div>

          <div class="h-12 bg-outline-variant rounded-xl w-full"></div>
        </div>
      } @else {
        <div class="px-4 pt-4 pb-8 flex flex-col gap-6">
          <div class="flex flex-col items-center gap-3">
            <div class="relative">
              @if (photoPreview()) {
                <img
                  [src]="photoPreview()"
                  alt="Foto de perfil"
                  class="w-24 h-24 rounded-full object-cover border-2 border-outline-variant"
                />
              } @else {
                <div
                  class="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center font-sans text-2xl font-bold shadow-sm"
                >
                  {{ initials() }}
                </div>
              }
              <button
                type="button"
                class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:bg-primary-700 transition-colors"
                (click)="takePhoto()"
                aria-label="Cambiar foto"
              >
                <i class="not-italic text-sm mgc_camera_line"></i>
              </button>
            </div>
            <p class="font-sans text-xs text-on-surface-variant m-0">
              Toca el icono para cambiar la foto
            </p>
          </div>

          <div class="flex flex-col gap-4">
            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Nombre
              </label>
              <input
                [(ngModel)]="formData.firstName"
                placeholder="ej. Roberto"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Apellido
              </label>
              <input
                [(ngModel)]="formData.lastName"
                placeholder="ej. García"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Especialidad principal
              </label>
              <input
                [(ngModel)]="formData.specialty"
                placeholder="ej. Ginecología y Obstetricia"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Especialidades (una por línea)
              </label>
              <textarea
                [(ngModel)]="specialtiesText"
                placeholder="Ginecología&#10;Obstetricia&#10;Colposcopía"
                rows="3"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface placeholder:text-[#9ca3af] outline-none resize-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              ></textarea>
            </div>

            <div>
              <label class="block font-sans text-xs font-semibold text-on-surface-variant mb-1.5">
                Tipo de perfil
              </label>
              <select
                [(ngModel)]="formData.badge"
                class="w-full px-3.5 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm text-on-surface outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737784%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10"
              >
                <option value="Médico">Médico</option>
                <option value="Especialista">Especialista</option>
                <option value="Residente">Residente</option>
                <option value="Enfermero">Enfermero</option>
              </select>
            </div>
          </div>

          <ion-button
            class="w-full"
            [disabled]="!isValid()"
            (click)="save()"
          >
            Guardar cambios
          </ion-button>
        </div>
      }
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
export class EditProfilePage {
  private router = inject(Router);
  readonly profileService = inject(DoctorProfileService);

  readonly skeletonFields = [1, 2, 3];

  readonly photoPreview = signal<string | undefined>(undefined);

  readonly formData = {
    firstName: '',
    lastName: '',
    specialty: '',
    badge: '',
  };

  specialtiesText = '';

  private ready = false;

  constructor() {
    effect(() => {
      if (this.profileService.loading()) return;
      const p = this.profileService.profile();
      if (!this.ready) {
        this.ready = true;
        this.formData.firstName = p.firstName;
        this.formData.lastName = p.lastName;
        this.formData.specialty = p.specialty;
        this.formData.badge = p.badge;
        this.specialtiesText = p.specialties.join('\n');
        this.photoPreview.set(p.photoUrl);
      }
    });
  }

  initials(): string {
    return `${this.formData.firstName[0] ?? ''}${this.formData.lastName[0] ?? ''}`.toUpperCase() || 'DR';
  }

  isValid(): boolean {
    return (
      this.formData.firstName.trim().length > 0 &&
      this.formData.lastName.trim().length > 0 &&
      this.formData.specialty.trim().length > 0 &&
      this.formData.badge.trim().length > 0
    );
  }

  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        quality: 90,
        allowEditing: true,
      });
      if (photo.dataUrl) {
        this.photoPreview.set(photo.dataUrl);
      }
    } catch {
      // User cancelled or error
    }
  }

  async save() {
    if (!this.isValid()) return;

    const profile: DoctorProfile = {
      firstName: this.formData.firstName.trim(),
      lastName: this.formData.lastName.trim(),
      specialty: this.formData.specialty.trim(),
      specialties: this.specialtiesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      badge: this.formData.badge,
      photoUrl: this.photoPreview(),
    };

    await this.profileService.update(profile);
    this.router.navigate(['/home/settings']);
  }

  goBack() {
    this.router.navigate(['/home/settings']);
  }
}
