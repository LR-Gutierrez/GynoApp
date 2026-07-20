import { Component, signal, inject, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { GynoTopbarComponent } from 'src/app/shared/components/gyno-topbar/gyno-topbar.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { GynoPinInputComponent } from 'src/app/shared/components/gyno-pin-input/gyno-pin-input.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { SettingsService, TimeFormat } from 'src/app/core/services/settings.service';
import { ExportService } from 'src/app/core/services/export.service';

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
  private settings = inject(SettingsService);
  private exportService = inject(ExportService);

  readonly biometricEnabled = signal(false);
  readonly language = signal('Español');
  readonly notificationsEnabled = signal(true);
  readonly timeFormat = signal<TimeFormat>('24h');
  readonly logoutLoading = signal(false);
  readonly exportLoading = signal(false);
  readonly cleaningCache = signal(false);

  // Change PIN
  readonly showChangePin = signal(false);
  readonly changePinStep = signal<'old' | 'new' | 'confirm'>('old');
  readonly oldPin = signal('');
  readonly newPin = signal('');
  readonly pinError = signal('');
  readonly pinLoading = signal(false);
  readonly resetPinFlag = signal(0);

  // Import PIN
  readonly showImportPin = signal(false);
  readonly importPinError = signal('');
  readonly importPinReset = signal(0);
  readonly importPinValue = signal('');
  private importFileData: Uint8Array | null = null;

  // Export PIN
  readonly showExportPin = signal(false);
  readonly exportPinError = signal('');
  readonly exportPinReset = signal(0);
  readonly exportPinValue = signal('');

  async ngOnInit() {
    this.biometricEnabled.set(this.auth.isBiometricEnabled());
    this.timeFormat.set(await this.settings.getTimeFormat());
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
  async toggleTimeFormat() {
    const next: TimeFormat = this.timeFormat() === '24h' ? '12h' : '24h';
    this.timeFormat.set(next);
    await this.settings.setTimeFormat(next);
  }
  async exportHistory() {
    const stats = await this.exportService.getExportStats();

    let msg = `Se exportarán ${stats.patients} paciente${stats.patients !== 1 ? 's' : ''}, ${stats.consultations} consulta${stats.consultations !== 1 ? 's' : ''}`;

    if (stats.photos > 0) {
      msg += ` y ${stats.photos} foto${stats.photos !== 1 ? 's' : ''}`;
    }

    if (stats.estimatedSizeBytes > 0) {
      const mb = (stats.estimatedSizeBytes / (1024 * 1024)).toFixed(1);
      msg += ` (~${mb} MB)`;

      if (stats.estimatedSizeBytes > 100 * 1024 * 1024) {
        msg += '\n\n⚠️ El archivo es muy grande y podría fallar al exportar.';
      }
    }

    msg += '\n\nFormato .gyncbak — respaldo cifrado exclusivo de GynoApp.';

    const alert = await this.alertCtrl.create({
      header: 'Exportar historial',
      message: msg,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Exportar', handler: () => {
          this.exportPinError.set('');
          this.exportPinReset.update(v => v + 1);
          this.showExportPin.set(true);
        }},
      ],
      mode: 'ios',
    });
    await alert.present();
  }

  private async doExport() {
    this.exportLoading.set(true);

    const loading = await this.alertCtrl.create({
      header: 'Exportando...',
      message: 'Preparando datos...',
      mode: 'ios',
      backdropDismiss: false,
    });
    await loading.present();

    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `historial_clinico_${dateStr}.gyncbak`;

      const blob = await this.exportService.exportToGyncbak(
        (current, total, label) => {
          loading.message = label;
        }
      );

      await loading.dismiss();

      // Try native share
      let shared = false;
      try {
        const base64 = await this.blobToBase64(blob);
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });

        const uri = (await Filesystem.getUri({ path: fileName, directory: Directory.Cache })).uri;

        await Share.share({
          title: 'Respaldo GynoApp',
          text: `Respaldo clínico — ${dateStr}`,
          url: uri,
        });
        shared = true;

        await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
      } catch {
        // Share not available — browser download fallback
      }

      if (!shared) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }

      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    } catch (e: any) {
      await loading.dismiss();
      const errAlert = await this.alertCtrl.create({
        header: 'Error',
        message: e?.message ?? 'Ocurrió un error al exportar.',
        buttons: ['OK'],
        mode: 'ios',
      });
      await errAlert.present();
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    } finally {
      this.exportLoading.set(false);
    }
  }

  async importBackup() {
    const fileData = await this.pickFile();
    if (!fileData) return;
    this.importFileData = fileData;
    this.importPinError.set('');
    this.importPinReset.update(v => v + 1);
    this.showImportPin.set(true);
  }

  async onImportPinComplete(pin: string) {
    const data = this.importFileData;
    if (!data) return;
    this.showImportPin.set(false);
    await this.processImport(data, pin);
  }

  onImportPinChange(pin: string) {
    this.importPinValue.set(pin);
  }

  async onImportPinConfirm() {
    const pin = this.importPinValue();
    if (pin.length < 4) return;
    await this.onImportPinComplete(pin);
  }

  onImportPinCancel() {
    this.showImportPin.set(false);
    this.importFileData = null;
  }

  async onImportBiometricClick() {
    const ok = await this.auth.authenticateWithBiometrics();
    if (!ok) return;
    this.showImportPin.set(false);
    // Biometric authenticates the user, but we still need a PIN for decryption
    const fileData = this.importFileData;
    if (!fileData) return;
    // Try with the current master key — derive from biometric session
    // If that fails, ask for the PIN manually
    const key = this.auth.getMasterKey();
    if (!key) {
      this.importPinError.set('Debes ingresar el PIN del respaldo.');
      this.importPinReset.update(v => v + 1);
      this.showImportPin.set(true);
      return;
    }
    // Use master key directly (same-device import)
    await this.processImport(fileData, null);
  }

  // --- Export PIN ---

  async onExportPinComplete(pin: string) {
    const valid = await this.auth.verifyPin(pin);
    if (!valid) {
      this.exportPinError.set('PIN incorrecto');
      this.exportPinReset.update(v => v + 1);
      return;
    }
    this.showExportPin.set(false);
    await this.doExport();
  }

  onExportPinChange(pin: string) {
    this.exportPinValue.set(pin);
  }

  async onExportPinConfirm() {
    const pin = this.exportPinValue();
    if (pin.length < 4) return;
    await this.onExportPinComplete(pin);
  }

  async onExportBiometricClick() {
    const ok = await this.auth.authenticateWithBiometrics();
    if (!ok) return;
    this.showExportPin.set(false);
    await this.doExport();
  }

  onExportPinCancel() {
    this.showExportPin.set(false);
  }

  private async processImport(fileData: Uint8Array, pin: string | null) {
    const loading = await this.alertCtrl.create({
      header: 'Importando...',
      message: 'Iniciando...',
      mode: 'ios',
      backdropDismiss: false,
    });
    await loading.present();

    try {
      const result = await this.exportService.importFromGyncbak(
        fileData,
        pin,
        (label) => { loading.message = label; }
      );

      await loading.dismiss();

      const summary = await this.alertCtrl.create({
        header: 'Importación completada',
        message: [
          `Pacientes: ${result.patients}`,
          `Consultas: ${result.consultations}`,
          `Fotos: ${result.photos}`,
        ].join('\n'),
        buttons: ['OK'],
        mode: 'ios',
      });
      await summary.present();

      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    } catch (e: any) {
      await loading.dismiss();

      if (pin && e?.message?.includes('PIN incorrecto')) {
        this.importPinError.set('PIN incorrecto. Intenta de nuevo.');
        this.importPinReset.update(v => v + 1);
        this.importFileData = fileData;
        this.showImportPin.set(true);
        return;
      }

      const errAlert = await this.alertCtrl.create({
        header: 'Error',
        message: e?.message ?? 'Ocurrió un error al importar.',
        buttons: ['OK'],
        mode: 'ios',
      });
      await errAlert.present();
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    }

    this.importFileData = null;
  }

  private pickFile(): Promise<Uint8Array | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.gyncbak';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = async () => {
        document.body.removeChild(input);
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const buffer = await file.arrayBuffer();
        resolve(new Uint8Array(buffer));
      };
      input.oncancel = () => {
        document.body.removeChild(input);
        resolve(null);
      };
      input.click();
    });
  }

  private async askPin(): Promise<string | null> {
    return new Promise(resolve => {
      this.alertCtrl.create({
        header: 'PIN de seguridad',
        message: 'Ingresa tu PIN para descifrar el respaldo.',
        inputs: [{
          name: 'pin',
          type: 'password',
          placeholder: 'PIN',
          attributes: { inputmode: 'numeric', maxlength: 6, autocomplete: 'off' },
        }],
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(null) },
          {
            text: 'Importar',
            handler: (data) => {
              resolve(data.pin || null);
              return true;
            },
          },
        ],
        mode: 'ios',
      }).then(a => a.present());
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  async cleanCache() {
    this.cleaningCache.set(true);
    try {
      const tasks: Promise<void>[] = [];

      // Web Cache API
      if ('caches' in window) {
        tasks.push(
          caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
          ).then(() => {})
        );
      }

      // Capacitor filesystem cache directory
      try {
        const { files } = await Filesystem.readdir({
          path: '',
          directory: Directory.Cache,
        });
        for (const f of files) {
          tasks.push(
            Filesystem.deleteFile({ path: f.name, directory: Directory.Cache }).catch(() => {})
          );
        }
      } catch {
        // Cache dir doesn't exist yet
      }

      await Promise.all(tasks);
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});

      const alert = await this.alertCtrl.create({
        header: 'Caché limpiado',
        message: 'Los datos temporales se han eliminado correctamente.',
        buttons: ['OK'],
        mode: 'ios',
      });
      await alert.present();
    } catch {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    } finally {
      this.cleaningCache.set(false);
    }
  }
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
