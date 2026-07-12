import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePage } from './home.page';
import { PlaceholderPage } from './placeholder.page';
import { PatientDetailPage } from '../patient-detail/patient-detail.page';
import { ConsultationDetailPage } from '../consultation-detail/consultation-detail.page';
import { CreateConsultationPage } from '../create-consultation/create-consultation.page';
import { SchedulePage } from './schedule.page';
import { CreateAppointmentPage } from '../create-appointment/create-appointment.page';

const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'patient/:id', component: PatientDetailPage },
  { path: 'patient/:id/consultation/new', component: CreateConsultationPage },
  { path: 'patient/:id/consultation/:consultationId', component: ConsultationDetailPage },
  { path: 'schedule', component: SchedulePage },
  { path: 'schedule/new', component: CreateAppointmentPage },
  { path: 'settings', component: PlaceholderPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
