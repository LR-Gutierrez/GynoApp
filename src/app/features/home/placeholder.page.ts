import { Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { GynoTopbarComponent } from 'src/app/shared/components/gyno-topbar/gyno-topbar.component';

@Component({
  selector: 'app-placeholder',
  template: `
    <gyno-topbar [title]="title()" />
    <ion-content class="px-4">
      <div class="flex flex-col items-center justify-center min-h-full text-center">
        <div class="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center mb-5">
          <ion-icon [name]="iconName()" class="text-4xl text-outline"></ion-icon>
        </div>
        <h2 class="font-sans text-xl font-bold text-on-surface m-0 mb-2">{{ title() }}</h2>
        <p class="font-sans text-sm text-on-surface-variant m-0 max-w-xs">{{ description() }}</p>
      </div>
    </ion-content>
    <gyno-bottom-nav />
  `,
  standalone: true,
  imports: [IonicModule, GynoBottomNavComponent, GynoTopbarComponent],
})
export class PlaceholderPage {
  readonly title = input('Sección');
  readonly description = input('Esta sección estará disponible próximamente.');
  readonly iconName = input('construct-outline');
}
