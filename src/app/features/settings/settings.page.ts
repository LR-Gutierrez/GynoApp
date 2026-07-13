import { Component, signal, inject, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { GynoTopbarComponent } from 'src/app/shared/components/gyno-topbar/gyno-topbar.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { GynoPinInputComponent } from 'src/app/shared/components/gyno-pin-input/gyno-pin-input.component';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    GynoTopbarComponent,
    GynoBottomNavComponent,
    GynoPinInputComponent,
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
export class SettingsPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  readonly biometricEnabled = signal(false);
  readonly language = signal('Español');
  readonly notificationsEnabled = signal(true);
  readonly logoutLoading = signal(false);

  // Change PIN
  readonly showChangePin = signal(false);
  readonly changePinStep = signal<'old' | 'new' | 'confirm'>('old');
  readonly oldPin = signal('');
  readonly newPin = signal('');
  readonly pinError = signal('');
  readonly pinLoading = signal(false);
  readonly resetPinFlag = signal(0);

  ngOnInit() {
    this.biometricEnabled.set(this.auth.isBiometricEnabled());
  }

  async toggleBiometric(checked: boolean) {
    if (checked) {
      const bio = await this.auth.checkBiometricAvailability();
      if (!bio.available) return;
      const ok = await this.auth.authenticateWithBiometrics();
      if (ok) {
        await this.auth.enableBiometrics();
        this.biometricEnabled.set(true);
      }
    } else {
      await this.auth.disableBiometrics();
      this.biometricEnabled.set(false);
    }
  }

  // --- Change PIN ---

  get changePinTitle(): string {
    switch (this.changePinStep()) {
      case 'old': return 'PIN actual';
      case 'new': return 'Nuevo PIN';
      case 'confirm': return 'Confirmar PIN';
    }
  }

  get changePinSubtitle(): string {
    switch (this.changePinStep()) {
      case 'old': return 'Ingresa tu PIN actual';
      case 'new': return 'Crea un nuevo PIN de seguridad';
      case 'confirm': return 'Ingresa nuevamente el nuevo PIN';
    }
  }

  get changePinShowBack(): boolean {
    return this.changePinStep() !== 'old';
  }

  get changePinShowConfirm(): boolean {
    return this.changePinStep() === 'confirm';
  }

  openChangePin() {
    this.changePinStep.set('old');
    this.oldPin.set('');
    this.newPin.set('');
    this.pinError.set('');
    this.showChangePin.set(true);
  }

  onPinComplete(pin: string) {
    if (this.pinLoading()) return;

    switch (this.changePinStep()) {
      case 'old':
        this.verifyOldPin(pin);
        break;
      case 'new':
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
        this.newPin.set(pin);
        this.changePinStep.set('confirm');
        break;
      case 'confirm':
        this.doChangePin(pin);
        break;
    }
  }

  private async verifyOldPin(pin: string) {
    this.pinLoading.set(true);
    const valid = await this.auth.verifyPin(pin);
    this.pinLoading.set(false);
    if (valid) {
      this.oldPin.set(pin);
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      this.changePinStep.set('new');
    } else {
      this.pinError.set('PIN incorrecto');
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      this.resetPinFlag.update(v => v + 1);
    }
  }

  onPinBack() {
    if (this.changePinStep() === 'new') {
      this.changePinStep.set('old');
      this.pinError.set('');
    } else if (this.changePinStep() === 'confirm') {
      this.changePinStep.set('new');
      this.pinError.set('');
    }
  }

  onPinConfirm() {
    // confirm button tapped in step 'confirm', do nothing extra
  }

  private async doChangePin(pin: string) {
    const newPin = this.newPin();

    if (newPin !== pin) {
      this.pinError.set('Los PIN no coinciden');
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      this.changePinStep.set('new');
      return;
    }

    this.pinLoading.set(true);
    try {
      await this.auth.registerPin(newPin);
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      this.showChangePin.set(false);
    } catch {
      this.pinError.set('Error al cambiar el PIN');
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    } finally {
      this.pinLoading.set(false);
    }
  }

  onPinCancel() {
    this.showChangePin.set(false);
  }

  // --- Actions ---

  selectLanguage() {}
  exportHistory() {}
  cleanCache() {}
  openPrivacy() {}
  openTerms() {}
  openSupport() {}

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      mode: 'ios',
      cssClass: 'text-center',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: async () => {
            this.logoutLoading.set(true);
            try {
              await this.auth.logout();
            } finally {
              this.logoutLoading.set(false);
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
