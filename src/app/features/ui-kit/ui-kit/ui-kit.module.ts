import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UiKitPageRoutingModule } from './ui-kit-routing.module';

import { UiKitPage } from './ui-kit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UiKitPageRoutingModule,
    UiKitPage
  ],
  declarations: []
})
export class UiKitPageModule {}
