import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePage } from './home.page';
import { PlaceholderPage } from './placeholder.page';
import { PatientDetailPage } from '../patient-detail/patient-detail.page';
import { ConsultationDetailPage } from '../consultation-detail/consultation-detail.page';
import { CreateConsultationPage } from '../create-consultation/create-consultation.page';
import { SchedulePage } from './schedule.page';
import { CreateAppointmentPage } from '../create-appointment/create-appointment.page';
import { SettingsPage } from '../settings/settings.page';
import { EditProfilePage } from '../edit-profile/edit-profile.page';
import { PatientFormPage } from '../patient-form/patient-form.page';
import { RecentConsultationsPage } from './recent-consultations.page';
import { CanDeactivateGuard } from 'src/app/core/guards/can-deactivate.guard';

const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'recent-consultations', component: RecentConsultationsPage },
  { path: 'patient/new', component: PatientFormPage, canDeactivate: [CanDeactivateGuard] },
  { path: 'patient/:id/edit', component: PatientFormPage, canDeactivate: [CanDeactivateGuard] },
  { path: 'patient/:id', component: PatientDetailPage },
  { path: 'patient/:id/consultation/new', component: CreateConsultationPage, canDeactivate: [CanDeactivateGuard] },
  { path: 'patient/:id/consultation/:consultationId', component: ConsultationDetailPage },
  { path: 'schedule', component: SchedulePage },
  { path: 'schedule/new', component: CreateAppointmentPage, canDeactivate: [CanDeactivateGuard] },
  { path: 'settings', component: SettingsPage },
  { path: 'edit-profile', component: EditProfilePage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
