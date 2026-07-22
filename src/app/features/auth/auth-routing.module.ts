import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthPage } from './auth.page';
import { BiometricSetupPage } from './biometric-setup.page';
import { ResetPasswordPage } from './reset-password.page';
import { SecurityQuestionsPage } from './security-questions.page';

const routes: Routes = [
  { path: '', component: AuthPage },
  { path: 'biometric-setup', component: BiometricSetupPage },
  { path: 'reset-password', component: ResetPasswordPage },
  { path: 'security-questions', component: SecurityQuestionsPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthPageRoutingModule {}
