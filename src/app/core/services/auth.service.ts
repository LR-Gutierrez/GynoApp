import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { CryptoService } from './crypto.service';
import { SettingsService } from './settings.service';

const PIN_KEY = 'gyno_pin_hash';
const SALT_KEY = 'gyno_pin_salt';
const BIOMETRIC_KEY = 'gyno_biometric_enabled';
const PIN_ATTEMPTS_KEY = 'gyno_pin_attempts';
const PIN_LOCKOUT_KEY = 'gyno_pin_lockout';
const LAST_ACTIVITY_KEY = 'gyno_last_activity';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATIONS = [30_000, 60_000, 120_000, 300_000];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private platform = inject(Platform);
  private crypto = inject(CryptoService);
  private settings = inject(SettingsService);

  readonly isAuthenticated = signal(false);
  readonly hasPin = signal(false);
  readonly isBiometricEnabled = signal(false);

  private masterKey: CryptoKey | null = null;

  async init() {
    const pinHash = await Preferences.get({ key: PIN_KEY });
    this.hasPin.set(!!pinHash.value);

    const biometric = await Preferences.get({ key: BIOMETRIC_KEY });
    this.isBiometricEnabled.set(biometric.value === 'true');

    const lastActivity = await this.getLastActivity();
    if (lastActivity > 0) {
      const minutes = await this.settings.getAutoLock();
      if (minutes > 0 && Date.now() - lastActivity < minutes * 60 * 1000) {
        this.isAuthenticated.set(true);
        return;
      }
    }

    this.isAuthenticated.set(false);
  }

  async registerPin(pin: string): Promise<void> {
    const { salt, hash } = await this.crypto.hashPin(pin);
    await Preferences.set({ key: PIN_KEY, value: hash });
    await Preferences.set({ key: SALT_KEY, value: salt });
    this.hasPin.set(true);
  }

  async getPinAttempts(): Promise<number> {
    const r = await Preferences.get({ key: PIN_ATTEMPTS_KEY });
    return r.value ? parseInt(r.value, 10) : 0;
  }

  async getLockoutEnd(): Promise<number> {
    const r = await Preferences.get({ key: PIN_LOCKOUT_KEY });
    return r.value ? parseInt(r.value, 10) : 0;
  }

  async getRemainingLockoutMs(): Promise<number> {
    const end = await this.getLockoutEnd();
    if (!end) return 0;
    const remaining = end - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  private async incrementPinAttempts() {
    const attempts = await this.getPinAttempts();
    const next = attempts + 1;
    await Preferences.set({ key: PIN_ATTEMPTS_KEY, value: String(next) });
    if (next >= MAX_ATTEMPTS) {
      const idx = Math.min(next - MAX_ATTEMPTS, LOCKOUT_DURATIONS.length - 1);
      const duration = LOCKOUT_DURATIONS[idx];
      await Preferences.set({ key: PIN_LOCKOUT_KEY, value: String(Date.now() + duration) });
    }
  }

  private async resetPinAttempts() {
    await Preferences.remove({ key: PIN_ATTEMPTS_KEY });
    await Preferences.remove({ key: PIN_LOCKOUT_KEY });
  }

  async verifyPin(pin: string): Promise<{ valid: boolean; lockoutMs: number }> {
    const lockoutMs = await this.getRemainingLockoutMs();
    if (lockoutMs > 0) {
      return { valid: false, lockoutMs };
    }

    const hashResult = await Preferences.get({ key: PIN_KEY });
    const saltResult = await Preferences.get({ key: SALT_KEY });

    if (!hashResult.value || !saltResult.value) return { valid: false, lockoutMs: 0 };

    const valid = await this.crypto.verifyPin(pin, saltResult.value, hashResult.value);
    if (valid) {
      await this.resetPinAttempts();
      const saltBytes = this.crypto.hexToBuffer(saltResult.value);
      this.masterKey = await this.crypto.deriveKey(pin, saltBytes);
      this.isAuthenticated.set(true);
      await this.updateLastActivity();
      return { valid: true, lockoutMs: 0 };
    } else {
      await this.incrementPinAttempts();
      const newLockoutMs = await this.getRemainingLockoutMs();
      return { valid: false, lockoutMs: newLockoutMs };
    }
  }

  getMasterKey(): CryptoKey | null {
    return this.masterKey;
  }

  async updateLastActivity() {
    await Preferences.set({ key: LAST_ACTIVITY_KEY, value: String(Date.now()) });
  }

  private async getLastActivity(): Promise<number> {
    const r = await Preferences.get({ key: LAST_ACTIVITY_KEY });
    return r.value ? parseInt(r.value, 10) : 0;
  }

  async logout() {
    this.masterKey = null;
    this.isAuthenticated.set(false);
    await Preferences.remove({ key: LAST_ACTIVITY_KEY });
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
