import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoSecurityBadgeComponent } from 'src/app/shared/components/gyno-security-badge/gyno-security-badge.component';

@Component({
  selector: 'app-biometric-setup',
  templateUrl: './biometric-setup.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule,
    GynoPageHeaderComponent,
    GynoSecurityBadgeComponent,
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
export class BiometricSetupPage {
  private platform = inject(Platform);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly error = signal('');
  readonly loading = signal(false);

  get isAndroid(): boolean {
    return this.platform.is('android');
  }

  goBack() {
    history.back();
  }

  async enableBiometrics() {
    this.error.set('');
    this.loading.set(true);

    const bio = await this.auth.checkBiometricAvailability();

    if (!bio.available) {
      this.error.set(
        'Este dispositivo no tiene métodos biométricos disponibles. ' +
        'Puedes saltar este paso y usar solo PIN.'
      );
      this.loading.set(false);
      return;
    }

    const ok = await this.auth.authenticateWithBiometrics();
    if (ok) {
      await this.auth.enableBiometrics();
      this.router.navigate(['/onboarding']);
    } else {
      this.error.set('No se pudo completar la autenticación. Intenta de nuevo.');
    }

    this.loading.set(false);
  }

  skip() {
    this.router.navigate(['/onboarding']);
  }
}
