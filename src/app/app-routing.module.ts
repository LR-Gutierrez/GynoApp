import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'ui-kit',
    loadChildren: () => import('./features/ui-kit/ui-kit/ui-kit.module').then(m => m.UiKitPageModule)
  },
  {
    path: '',
    redirectTo: 'ui-kit',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
