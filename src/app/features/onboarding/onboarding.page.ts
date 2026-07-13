import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType } from '@capacitor/camera';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { DoctorProfileService } from 'src/app/shared/services/doctor-profile.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    GynoPageHeaderComponent,
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
export class OnboardingPage {
  private router = inject(Router);
  private profileService = inject(DoctorProfileService);

  readonly photoPreview = signal<string | undefined>(undefined);

  readonly formData = {
    firstName: '',
    lastName: '',
    specialty: '',
    badge: 'Médico',
  };

  specialtiesText = '';

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

    const profile = {
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
    this.router.navigate(['/home']);
  }
}
