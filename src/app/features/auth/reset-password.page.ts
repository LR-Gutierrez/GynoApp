import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';
import { GynoLoadingButtonComponent } from 'src/app/shared/components/gyno-loading-button/gyno-loading-button.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  standalone: true,
  imports: [
    IonicModule,
    GynoPageHeaderComponent,
    GynoFormFieldComponent,
    GynoLoadingButtonComponent,
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
export class ResetPasswordPage {
  readonly step = signal<'email' | 'code' | 'new-password' | 'success'>('email');
  readonly email = signal('');
  readonly code = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(private router: Router) {}

  goBack() {
    if (this.step() === 'code') {
      this.step.set('email');
      this.error.set('');
    } else if (this.step() === 'new-password') {
      this.step.set('code');
      this.error.set('');
    } else {
      history.back();
    }
  }

  sendCode() {
    this.error.set('');
    if (!this.email()) {
      this.error.set('Ingresa tu correo electrónico');
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.step.set('code');
    }, 800);
  }

  verifyCode() {
    this.error.set('');
    if (!this.code()) {
      this.error.set('Ingresa el código de verificación');
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.step.set('new-password');
    }, 800);
  }

  resetPassword() {
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
    setTimeout(() => {
      this.loading.set(false);
      this.step.set('success');
    }, 1000);
  }

  goToLogin() {
    this.router.navigate(['/auth']);
  }
}
