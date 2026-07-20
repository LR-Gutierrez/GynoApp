import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { PlaceholderPage } from './placeholder.page';
import { PatientDetailPage } from '../patient-detail/patient-detail.page';
import { ConsultationDetailPage } from '../consultation-detail/consultation-detail.page';
import { CreateConsultationPage } from '../create-consultation/create-consultation.page';
import { CreateAppointmentPage } from '../create-appointment/create-appointment.page';
import { SchedulePage } from './schedule.page';
import { SettingsPage } from '../settings/settings.page';
import { EditProfilePage } from '../edit-profile/edit-profile.page';
import { PatientFormPage } from '../patient-form/patient-form.page';
import { RecentConsultationsPage } from './recent-consultations.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    HomePage,
    PlaceholderPage,
    PatientDetailPage,
    ConsultationDetailPage,
    CreateConsultationPage,
    CreateAppointmentPage,
    SchedulePage,
    SettingsPage,
    EditProfilePage,
    PatientFormPage,
    RecentConsultationsPage,
  ],
  declarations: [],
})
export class HomePageModule {}
