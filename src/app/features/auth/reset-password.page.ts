import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { SecurityQuestionService } from 'src/app/core/services/security-question.service';

type Step = 'choose' | 'biometric' | 'question' | 'new-pin' | 'confirm-pin' | 'success';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
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
      .key-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--color-on-surface);
        font-size: 28px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .key-btn:active {
        background: var(--color-surface-container-high);
      }
      .key-btn:disabled {
        opacity: 0.3;
        pointer-events: none;
      }
      .key-btn.invisible {
        visibility: hidden;
      }
    `,
  ],
})
export class ResetPasswordPage implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private securityQuestionService = inject(SecurityQuestionService);

  readonly step = signal<Step>('choose');
  readonly question = signal('');
  readonly answer = signal('');
  readonly error = signal('');
  readonly loading = signal(false);
  readonly hasBiometric = signal(false);
  readonly hasSecurityQuestion = signal(false);

  // PIN flow
  readonly pin = signal<number[]>([]);
  readonly pinConfirm = signal<number[]>([]);

  async ngOnInit() {
    this.hasBiometric.set(this.auth.isBiometricEnabled());
    this.hasSecurityQuestion.set(await this.securityQuestionService.hasQuestion());
    if (this.hasSecurityQuestion()) {
      this.question.set((await this.securityQuestionService.getQuestion()) ?? '');
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key >= '0' && event.key <= '9') {
      if (this.step() === 'new-pin') this.onDigit(event.key);
      else if (this.step() === 'confirm-pin') this.onConfirmDigit(event.key);
      return;
    }
    if (event.key === 'Backspace') {
      this.onBackspace();
      return;
    }
    if (event.key === 'Enter') {
      if (this.step() === 'new-pin' && this.pin().length >= 4) this.goToConfirmStep();
      else if (this.step() === 'confirm-pin' && this.pinConfirm().length >= 4) this.submitPin();
    }
  }

  goBack() {
    switch (this.step()) {
      case 'biometric':
      case 'question':
        this.step.set('choose');
        this.error.set('');
        break;
      case 'new-pin':
        this.pin.set([]);
        this.step.set('choose');
        this.error.set('');
        break;
      case 'confirm-pin':
        this.pinConfirm.set([]);
        this.step.set('new-pin');
        this.error.set('');
        break;
      default:
        this.router.navigate(['/auth']);
    }
  }

  chooseBiometric() {
    this.step.set('biometric');
    this.doBiometricAuth();
  }

  chooseQuestion() {
    this.step.set('question');
  }

  async doBiometricAuth() {
    this.loading.set(true);
    this.error.set('');
    try {
      const ok = await this.auth.authenticateWithBiometrics();
      if (ok) {
        this.step.set('new-pin');
      } else {
        this.error.set('No se pudo verificar tu identidad. Intenta de nuevo.');
      }
    } catch {
      this.error.set('Error al usar autenticación biométrica');
    } finally {
      this.loading.set(false);
    }
  }

  async verifyAnswer() {
    this.error.set('');
    if (!this.answer()) {
      this.error.set('Escribe tu respuesta');
      return;
    }
    this.loading.set(true);
    try {
      const valid = await this.securityQuestionService.verify(this.answer().toLowerCase().trim());
      if (valid) {
        this.step.set('new-pin');
      } else {
        this.error.set('Respuesta incorrecta. Intenta de nuevo.');
      }
    } catch {
      this.error.set('Error al verificar la respuesta');
    } finally {
      this.loading.set(false);
    }
  }

  onDigit(d: string) {
    if (this.pin().length >= 6) return;
    this.pin.update(p => [...p, parseInt(d, 10)]);
    this.error.set('');
  }

  onConfirmDigit(d: string) {
    if (this.pinConfirm().length >= 6) return;
    this.pinConfirm.update(p => [...p, parseInt(d, 10)]);
    this.error.set('');
  }

  goToConfirmStep() {
    if (this.pin().length < 4) return;
    this.pinConfirm.set([]);
    this.step.set('confirm-pin');
  }

  submitPin() {
    if (this.pinConfirm().length < 4) return;
    this.doReset();
  }

  onBackspace() {
    if (this.step() === 'new-pin') {
      if (this.pin().length === 0) { this.goBack(); return; }
      this.pin.update(p => p.slice(0, -1));
    } else if (this.step() === 'confirm-pin') {
      if (this.pinConfirm().length === 0) { this.goBack(); return; }
      this.pinConfirm.update(p => p.slice(0, -1));
    }
  }

  private async doReset() {
    const p1 = this.pin().join('');
    const p2 = this.pinConfirm().join('');

    if (p1 !== p2) {
      this.error.set('Los PIN no coinciden');
      this.pin.set([]);
      this.pinConfirm.set([]);
      this.step.set('new-pin');
      return;
    }

    if (p1.length < 4) {
      this.error.set('El PIN debe tener al menos 4 dígitos');
      this.pin.set([]);
      this.pinConfirm.set([]);
      this.step.set('new-pin');
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.registerPin(p1);
      this.step.set('success');
    } catch {
      this.error.set('Error al restablecer el PIN');
    } finally {
      this.loading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/auth']);
  }
}
