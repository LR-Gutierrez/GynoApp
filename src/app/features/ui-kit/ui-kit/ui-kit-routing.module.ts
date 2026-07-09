import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UiKitPage } from './ui-kit.page';

const routes: Routes = [
  {
    path: '',
    component: UiKitPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UiKitPageRoutingModule {}
