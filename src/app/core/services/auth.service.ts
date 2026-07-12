import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { CryptoService } from './crypto.service';

const PIN_KEY = 'gyno_pin_hash';
const SALT_KEY = 'gyno_pin_salt';
const BIOMETRIC_KEY = 'gyno_biometric_enabled';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private platform = inject(Platform);
  private crypto = inject(CryptoService);

  readonly isAuthenticated = signal(false);
  readonly hasPin = signal(false);
  readonly isBiometricEnabled = signal(false);

  private masterKey: CryptoKey | null = null;

  async init() {
    const pinHash = await Preferences.get({ key: PIN_KEY });
    this.hasPin.set(!!pinHash.value);

    const biometric = await Preferences.get({ key: BIOMETRIC_KEY });
    this.isBiometricEnabled.set(biometric.value === 'true');

    this.isAuthenticated.set(false);
  }

  async registerPin(pin: string): Promise<void> {
    const { salt, hash } = await this.crypto.hashPin(pin);
    await Preferences.set({ key: PIN_KEY, value: hash });
    await Preferences.set({ key: SALT_KEY, value: salt });
    this.hasPin.set(true);
  }

  async verifyPin(pin: string): Promise<boolean> {
    const hashResult = await Preferences.get({ key: PIN_KEY });
    const saltResult = await Preferences.get({ key: SALT_KEY });

    if (!hashResult.value || !saltResult.value) return false;

    const valid = await this.crypto.verifyPin(pin, saltResult.value, hashResult.value);
    if (valid) {
      const saltBytes = this.crypto.hexToBuffer(saltResult.value);
      this.masterKey = await this.crypto.deriveKey(pin, saltBytes);
      this.isAuthenticated.set(true);
    }
    return valid;
  }

  getMasterKey(): CryptoKey | null {
    return this.masterKey;
  }

  async logout() {
    this.masterKey = null;
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth']);
  }

  async checkBiometricAvailability(): Promise<{ available: boolean; strongBiometry: boolean }> {
    try {
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
      const result = await BiometricAuth.checkBiometry();
      return { available: result.isAvailable, strongBiometry: result.strongBiometryIsAvailable };
    } catch {
      return { available: false, strongBiometry: false };
    }
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
      await BiometricAuth.authenticate({
        reason: 'Accede a GynoApp',
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
      });
      this.isAuthenticated.set(true);
      return true;
    } catch (e: any) {
      if (e?.code === 'userCancel') return false;
      if (e?.code === 'systemCancel') return false;
      if (e?.code === 'appCancel') return false;
      return false;
    }
  }

  async enableBiometrics() {
    await Preferences.set({ key: BIOMETRIC_KEY, value: 'true' });
    this.isBiometricEnabled.set(true);
  }

  async disableBiometrics() {
    await Preferences.set({ key: BIOMETRIC_KEY, value: 'false' });
    this.isBiometricEnabled.set(false);
  }
}
