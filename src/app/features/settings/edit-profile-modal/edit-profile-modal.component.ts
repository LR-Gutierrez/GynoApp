import { Component, input, output, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType } from '@capacitor/camera';
import type { DoctorProfile } from 'src/app/shared/models/doctor.model';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="backdrop-enter fixed inset-0 z-[60] bg-black/60 flex items-end justify-center">
        <div class="absolute inset-0" (click)="cancel()"></div>

        <div
          class="relative w-full max-w-sm md:max-w-md lg:max-w-lg bg-surface-container-lowest rounded-t-2xl px-8 pt-8 pb-10 shadow-2xl max-h-[90vh] overflow-y-auto"
          [class.sheet-enter]="!isDragging() && !isClosing() && !isSnapping()"
          [class.is-closing]="isClosing()"
          [class.is-dragging]="isDragging()"
          [class.is-snapping]="isSnapping()"
          [style.transform]="sheetTransform()"
          (click)="$event.stopPropagation()"
        >
          <div
            class="cursor-grab active:cursor-grabbing touch-none select-none flex flex-col items-center pt-1 pb-4 mb-4 -mx-8 px-8"
            (mousedown)="onHandlePointerDown($event)"
            (touchstart)="onHandlePointerDown($event)"
          >
            <div class="w-10 h-1 rounded-full bg-outline-variant"></div>
          </div>

          <h3 class="font-sans text-xl font-bold text-on-surface text-center m-0 mb-1 tracking-tight">
            Editar perfil
          </h3>
          <p class="font-sans text-sm text-on-surface-variant text-center m-0 mb-8">
            Actualiza tu información profesional
          </p>

          <div class="flex flex-col items-center gap-3 mb-8">
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

          <div class="flex flex-col gap-4 mb-8">
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
      </div>
    }
  `,
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }

      .backdrop-enter {
        animation: backdropFade 0.3s ease-out;
      }

      @keyframes backdropFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .sheet-enter {
        animation: sheetSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes sheetSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      .is-dragging {
        transition: none !important;
      }

      .is-closing {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      .is-snapping {
        transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      ::placeholder {
        color: #9ca3af;
      }
    `,
  ],
})
export class EditProfileModalComponent {
  readonly visible = input(false);
  readonly profile = input<DoctorProfile>();

  readonly saveProfile = output<DoctorProfile>();
  readonly cancelProfile = output<void>();

  readonly formData = {
    firstName: '',
    lastName: '',
    specialty: '',
    badge: '',
  };

  specialtiesText = '';
  readonly photoPreview = signal<string | undefined>(undefined);
  readonly dragOffsetY = signal(0);
  readonly isDragging = signal(false);
  readonly isClosing = signal(false);

  private pendingProfile: DoctorProfile | null = null;
  private dragStartY = 0;
  private currentDragY = 0;

  readonly isSnapping = signal(false);

  readonly sheetTransform = computed(() => {
    if (this.isClosing()) return 'translateY(100%)';
    if (this.isDragging() || this.isSnapping()) return `translateY(${this.dragOffsetY()}px)`;
    return null;
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.isClosing.set(false);
        this.isSnapping.set(false);
        this.isDragging.set(false);
        this.dragOffsetY.set(0);
      }
    });
  }

  ngOnInit() {
    const p = this.profile();
    if (p) {
      this.pendingProfile = p;
      this.formData.firstName = p.firstName;
      this.formData.lastName = p.lastName;
      this.formData.specialty = p.specialty;
      this.formData.badge = p.badge;
      this.specialtiesText = p.specialties.join('\n');
      this.photoPreview.set(p.photoUrl);
    }
  }

  onHandlePointerDown(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    this.dragStartY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.currentDragY = this.dragStartY;
    this.isDragging.set(true);
    this.dragOffsetY.set(0);
    this.isClosing.set(false);
    document.addEventListener('mousemove', this.onPointerMove);
    document.addEventListener('mouseup', this.onPointerUp);
    document.addEventListener('touchmove', this.onPointerMove, { passive: false });
    document.addEventListener('touchend', this.onPointerUp);
  }

  private onPointerMove = (e: MouseEvent | TouchEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.currentDragY = y;
    const delta = y - this.dragStartY;
    if (delta > 0) {
      this.dragOffsetY.set(Math.min(delta, window.innerHeight * 0.6));
    }
  };

  private onPointerUp = () => {
    document.removeEventListener('mousemove', this.onPointerMove);
    document.removeEventListener('mouseup', this.onPointerUp);
    document.removeEventListener('touchmove', this.onPointerMove);
    document.removeEventListener('touchend', this.onPointerUp);

    const offset = this.dragOffsetY();

    if (offset > 100) {
      this.isClosing.set(true);
      setTimeout(() => this.cancelProfile.emit(), 300);
    } else if (offset > 0) {
      this.isSnapping.set(true);
      this.isDragging.set(false);
      requestAnimationFrame(() => {
        this.dragOffsetY.set(0);
        setTimeout(() => this.isSnapping.set(false), 280);
      });
    } else {
      this.isDragging.set(false);
    }
  };

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

  save() {
    if (!this.isValid()) return;
    this.saveProfile.emit({
      firstName: this.formData.firstName.trim(),
      lastName: this.formData.lastName.trim(),
      specialty: this.formData.specialty.trim(),
      specialties: this.specialtiesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      badge: this.formData.badge,
      photoUrl: this.photoPreview(),
    });
  }

  cancel() {
    if (this.isDragging() || this.isSnapping()) return;
    this.isClosing.set(true);
    setTimeout(() => this.cancelProfile.emit(), 300);
  }
}
