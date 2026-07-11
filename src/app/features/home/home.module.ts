import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { PlaceholderPage } from './placeholder.page';
import { PatientDetailPage } from '../patient-detail/patient-detail.page';
import { ConsultationDetailPage } from '../consultation-detail/consultation-detail.page';

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
  ],
  declarations: [],
})
export class HomePageModule {}
