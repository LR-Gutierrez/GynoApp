import { Component, signal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';
import { GynoSecurityBadgeComponent } from 'src/app/shared/components/gyno-security-badge/gyno-security-badge.component';
import { GynoLoadingOverlayComponent } from 'src/app/shared/components/gyno-loading-overlay/gyno-loading-overlay.component';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    GynoFormFieldComponent,
    GynoSecurityBadgeComponent,
    GynoLoadingOverlayComponent,
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(24px)', opacity: 0 }),
        animate('220ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'translateX(-16px)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class AuthPage {
  readonly view = signal<'login' | 'reset'>('login');

  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly resetEmail = signal('');
  readonly code = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly resetStep = signal<'email' | 'code' | 'new-password' | 'success'>('email');

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async login() {
    this.error.set('');

    if (!this.email()) {
      this.error.set('Ingresa tu correo electrónico');
      return;
    }

    if (!this.password()) {
      this.error.set('Ingresa tu contraseña');
      return;
    }

    this.loading.set(true);
    await this.sleep(1200);
    this.loading.set(false);

    console.log('Login:', { email: this.email(), password: this.password() });
  }

  switchView(view: 'login' | 'reset') {
    this.view.set(view);
    this.error.set('');
    this.resetStep.set('email');
    this.resetEmail.set('');
    this.code.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  async sendCode() {
    this.error.set('');
    if (!this.resetEmail()) {
      this.error.set('Ingresa tu correo electrónico');
      return;
    }

    this.loading.set(true);
    await this.sleep(1000);
    this.loading.set(false);
    this.resetStep.set('code');
  }

  async verifyCode() {
    this.error.set('');
    if (!this.code()) {
      this.error.set('Ingresa el código de verificación');
      return;
    }

    this.loading.set(true);
    await this.sleep(1000);
    this.loading.set(false);
    this.resetStep.set('new-password');
  }

  async resetPassword() {
    this.error.set('');

    if (this.newPassword().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    await this.sleep(1200);
    this.loading.set(false);
    this.resetStep.set('success');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  goBackReset() {
    if (this.resetStep() === 'code') {
      this.resetStep.set('email');
      this.code.set('');
    } else if (this.resetStep() === 'new-password') {
      this.resetStep.set('code');
      this.newPassword.set('');
      this.confirmPassword.set('');
    }
    this.error.set('');
  }
}
