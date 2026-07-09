import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthPage } from './auth.page';
import { BiometricSetupPage } from './biometric-setup.page';

const routes: Routes = [
  { path: '', component: AuthPage },
  { path: 'biometric-setup', component: BiometricSetupPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthPageRoutingModule {}
