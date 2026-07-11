import { Component, inject } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  get isAndroid(): boolean {
    return this.platform.is('android');
  }

  goBack() {
    history.back();
  }

  enableBiometrics() {
    console.log('Biometric enabled');
  }

  skip() {
    history.back();
  }
}
