import { Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gync-loading-overlay',
  templateUrl: './gync-loading-overlay.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GyncLoadingOverlayComponent {
  readonly visible = input(false);
  readonly message = input('Cargando...');
}
