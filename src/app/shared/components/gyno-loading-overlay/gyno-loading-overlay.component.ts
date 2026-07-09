import { Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-loading-overlay',
  templateUrl: './gyno-loading-overlay.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GynoLoadingOverlayComponent {
  readonly visible = input(false);
  readonly message = input('Cargando...');
}
