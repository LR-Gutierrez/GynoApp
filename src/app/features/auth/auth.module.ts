import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthPageRoutingModule } from './auth-routing.module';
import { AuthPage } from './auth.page';
import { BiometricSetupPage } from './biometric-setup.page';
import { ResetPasswordPage } from './reset-password.page';
import { SecurityQuestionsPage } from './security-questions.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthPageRoutingModule,
    AuthPage,
    BiometricSetupPage,
    ResetPasswordPage,
    SecurityQuestionsPage,
  ],
  declarations: [],
})
export class AuthPageModule {}
