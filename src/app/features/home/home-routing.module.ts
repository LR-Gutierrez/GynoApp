import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePage } from './home.page';
import { PlaceholderPage } from './placeholder.page';

const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'schedule', component: PlaceholderPage },
  { path: 'settings', component: PlaceholderPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
