import { Component, signal, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GynoTopbarComponent } from 'src/app/shared/components/gyno-topbar/gyno-topbar.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { EditProfileModalComponent } from 'src/app/features/settings/edit-profile-modal/edit-profile-modal.component';
import { DoctorProfileService } from 'src/app/shared/services/doctor-profile.service';
import type { DoctorProfile } from 'src/app/shared/models/doctor.model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule,
    GynoTopbarComponent,
    GynoBottomNavComponent,
    EditProfileModalComponent,
  ],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }

      ion-toggle::part(track) {
        margin-inline-start: auto !important;
      }
    `,
  ],
})
export class SettingsPage {
  readonly profileService = inject(DoctorProfileService);

  readonly biometricEnabled = signal(false);
  readonly autoLockMinutes = signal(5);
  readonly language = signal('Español');
  readonly notificationsEnabled = signal(true);
  readonly showEditModal = signal(false);

  readonly autoLockOptions = [
    { value: 1, label: '1 minuto' },
    { value: 5, label: '5 minutos' },
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
  ];

  getAutoLockLabel(): string {
    const opt = this.autoLockOptions.find(
      (o) => o.value === this.autoLockMinutes(),
    );
    return opt?.label ?? `${this.autoLockMinutes()} minutos`;
  }

  openEditModal() {
    this.showEditModal.set(true);
  }

  onSaveProfile(data: DoctorProfile) {
    this.showEditModal.set(false);
    this.profileService.update(data);
  }

  onCancelEdit() {
    this.showEditModal.set(false);
  }

  changePin() {
    console.log('Change PIN');
  }

  selectAutoLock() {
    console.log('Select auto-lock');
  }

  selectLanguage() {
    console.log('Select language');
  }

  exportHistory() {
    console.log('Export history');
  }

  cleanCache() {
    console.log('Clean cache');
  }

  openPrivacy() {
    console.log('Open privacy policy');
  }

  openTerms() {
    console.log('Open terms');
  }

  openSupport() {
    console.log('Open support');
  }

  logout() {
    console.log('Logout');
  }
}
