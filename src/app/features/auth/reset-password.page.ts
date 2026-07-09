import { Component, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    GynoPageHeaderComponent,
    GynoFormFieldComponent,
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
  readonly error = signal('');

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
    this.step.set('code');
  }

  verifyCode() {
    this.error.set('');
    if (!this.code()) {
      this.error.set('Ingresa el código de verificación');
      return;
    }
    this.step.set('new-password');
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

    this.step.set('success');
  }
}
