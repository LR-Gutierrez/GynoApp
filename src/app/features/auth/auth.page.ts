import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  standalone: true,
  imports: [IonicModule],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }

      .pin-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid var(--color-outline);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .pin-dot.filled {
        background: var(--color-primary);
        border-color: var(--color-primary);
        transform: scale(1.1);
      }
      .pin-dot.error {
        border-color: var(--color-error);
        animation: shake 0.4s ease-in-out;
      }
      .pin-dot.error.filled {
        background: var(--color-error);
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }

      .key-btn {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: none;
        background: var(--color-surface-container-high);
        color: var(--color-on-surface);
        font-size: 1.5rem;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.1s ease;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .key-btn:active {
        background: var(--color-surface-container-highest);
        transform: scale(0.93);
      }
    `,
  ],
})
export class AuthPage implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private platform = inject(Platform);

  readonly pin = signal<string[]>([]);
  readonly pinConfirm = signal<string[]>([]);
  readonly error = signal('');
  readonly step = signal<'register' | 'confirm' | 'login'>('login');
  readonly loading = signal(false);

  @ViewChild('backspaceBtn') backspaceBtn!: ElementRef<HTMLButtonElement>;
  private holdTimer: ReturnType<typeof setInterval> | null = null;
  private holdInterval = 80;
  private biometricTriggered = false;

  ngOnInit() {
    if (this.auth.hasPin()) {
      this.step.set('login');
      this.tryBiometricOnLoad();
    } else {
      this.step.set('register');
    }
  }

  ngOnDestroy() {
    this.onBackspaceHoldEnd();
  }

  private async tryBiometricOnLoad() {
    if (!this.auth.isBiometricEnabled()) return;
    if (this.biometricTriggered) return;
    this.biometricTriggered = true;

    const bio = await this.auth.checkBiometricAvailability();
    if (!bio.available) return;

    this.hapticImpact(ImpactStyle.Light);
    const ok = await this.auth.authenticateWithBiometrics();
    if (ok) {
      this.hapticImpact(ImpactStyle.Medium);
      this.router.navigate(['/home']);
    } else {
      this.hapticImpact(ImpactStyle.Heavy);
    }
  }

  private async hapticImpact(style: ImpactStyle) {
    await Haptics.impact({ style });
  }

  onDigit(d: string) {
    if (this.loading()) return;
    this.hapticImpact(ImpactStyle.Light);

    if (this.step() === 'register' || this.step() === 'confirm') {
      if (this.pin().length >= 6) return;
      this.pin.set([...this.pin(), d]);
      this.error.set('');

      if (this.pin().length === 6 && this.step() === 'register') {
        setTimeout(() => this.goToConfirm(), 150);
      }
    } else {
      if (this.pin().length >= 6) return;
      this.pin.set([...this.pin(), d]);
      this.error.set('');

      if (this.pin().length === 6) {
        setTimeout(() => this.doLogin(), 150);
      }
    }
  }

  onBackspace() {
    if (this.loading()) return;
    this.hapticImpact(ImpactStyle.Light);
    this.pin.set(this.pin().slice(0, -1));
    this.error.set('');
  }

  onBackspaceHoldStart() {
    if (this.loading()) return;
    this.holdTimer = setInterval(() => {
      if (this.pin().length === 0) {
        this.onBackspaceHoldEnd();
        return;
      }
      this.pin.set(this.pin().slice(0, -1));
      this.error.set('');
    }, this.holdInterval);
  }

  onBackspaceHoldEnd() {
    if (this.holdTimer) {
      clearInterval(this.holdTimer);
      this.holdTimer = null;
    }
  }

  goToConfirm() {
    this.hapticImpact(ImpactStyle.Medium);
    this.pinConfirm.set(this.pin());
    this.pin.set([]);
    this.step.set('confirm');
  }

  goBackToRegister() {
    this.pin.set(this.pinConfirm());
    this.pinConfirm.set([]);
    this.step.set('register');
    this.error.set('');
  }

  async doRegister() {
    if (this.pin().length < 4) {
      this.error.set('El PIN debe tener al menos 4 dígitos');
      return;
    }

    const pin1 = this.pinConfirm().join('');
    const pin2 = this.pin().join('');

    if (pin1 !== pin2) {
      this.error.set('Los PIN no coinciden');
      this.hapticImpact(ImpactStyle.Heavy);
      this.pin.set([]);
      this.pinConfirm.set([]);
      this.step.set('register');
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.registerPin(pin1);
      await this.auth.verifyPin(pin1);
      this.hapticImpact(ImpactStyle.Medium);
      this.router.navigate(['/auth/biometric-setup']);
    } catch {
      this.error.set('Error al guardar el PIN');
    } finally {
      this.loading.set(false);
    }
  }

  async doLogin() {
    if (this.pin().length < 4) {
      this.error.set('PIN incompleto');
      return;
    }

    this.loading.set(true);
    try {
      const valid = await this.auth.verifyPin(this.pin().join(''));
      if (valid) {
        this.hapticImpact(ImpactStyle.Medium);
        this.router.navigate(['/home']);
      } else {
        this.error.set('PIN incorrecto');
        this.hapticImpact(ImpactStyle.Heavy);
        this.pin.set([]);
      }
    } catch {
      this.error.set('Error al verificar PIN');
      this.hapticImpact(ImpactStyle.Heavy);
    } finally {
      this.loading.set(false);
    }
  }

  async useBiometrics() {
    this.hapticImpact(ImpactStyle.Light);
    const ok = await this.auth.authenticateWithBiometrics();
    if (ok) {
      this.hapticImpact(ImpactStyle.Medium);
      this.router.navigate(['/home']);
    } else {
      this.hapticImpact(ImpactStyle.Heavy);
    }
  }
}
