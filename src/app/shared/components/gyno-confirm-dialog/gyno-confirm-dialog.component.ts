import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-confirm-dialog',
  templateUrl: './gyno-confirm-dialog.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GynoConfirmDialogComponent {
  readonly visible = input(false);
  readonly title = input('Confirmar Acción');
  readonly message = input('¿Estás seguro de que deseas realizar esta acción?');
  readonly confirmText = input('Confirmar');
  readonly cancelText = input('Cancelar');

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
